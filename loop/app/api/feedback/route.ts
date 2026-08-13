import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import {
  feedbackCreateSchema,
  feedbackListQuerySchema,
} from "@/lib/feedback-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  createWorkspaceFeedback,
  FeedbackServiceError,
  listWorkspaceFeedback,
} from "@/services/feedback-service";
import { classifyFeedback } from "@/services/classification-service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16 * 1024;

export async function GET(request: Request) {
  const authorization = await authorizeApi(PERMISSIONS.FEEDBACK_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  const url = new URL(request.url);

  const parsedQuery = feedbackListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The feedback-list query is invalid.",
      422,
      parsedQuery.error.flatten().fieldErrors,
    );
  }

  try {
    const page = await listWorkspaceFeedback(
      authorization.user.workspaceId,
      parsedQuery.data,
    );

    return apiSuccess(page);
  } catch (error: unknown) {
    console.error("Feedback list failed.", error);

    return apiError(
      "FEEDBACK_LIST_FAILED",
      "Feedback could not be loaded. Please try again.",
      500,
    );
  }
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The request origin could not be verified.",
      403,
    );
  }

  const authorization = await authorizeApi(
    PERMISSIONS.FEEDBACK_CREATE,
  );

  if (!authorization.ok) {
    return authorization.response;
  }

  const contentType =
    request.headers.get("content-type") ?? "";

  if (!contentType
    .toLowerCase()
    .includes("application/json")) {
    return apiError(
      "INVALID_CONTENT_TYPE",
      "Content-Type must be application/json.",
      415,
    );
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return apiError(
      "INVALID_JSON",
      "Request body could not be read.",
      400,
    );
  }

  if (
    new TextEncoder().encode(rawBody).byteLength >
    MAX_REQUEST_BYTES
  ) {
    return apiError(
      "PAYLOAD_TOO_LARGE",
      "Feedback payload is too large.",
      413,
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError(
      "INVALID_JSON",
      "Request body must contain valid JSON.",
      400,
    );
  }

  const parsedFeedback =
    feedbackCreateSchema.safeParse(payload);

  if (!parsedFeedback.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Review the highlighted feedback fields.",
      422,
      parsedFeedback.error.flatten().fieldErrors,
    );
  }

  try {
    // 1. Create feedback
    const feedback = await createWorkspaceFeedback(
      authorization.user.workspaceId,
      parsedFeedback.data,
    );

    // 2. Start AI classification
    //
    // We intentionally do not make the user wait for Gemini.
    // The feedback is already safely stored in the database.
    void classifyNewFeedback(feedback.id);

    // 3. Return the created feedback immediately
    return apiSuccess(
      {
        feedback,
      },
      201,
    );
  } catch (error: unknown) {
    if (error instanceof FeedbackServiceError) {
      return apiError(
        error.code,
        error.message,
        error.status,
        error.fieldErrors,
      );
    }

    console.error(
      "Feedback creation failed.",
      error,
    );

    return apiError(
      "FEEDBACK_CREATE_FAILED",
      "Feedback could not be saved. Please try again.",
      500,
    );
  }
}

/**
 * Automatically classify newly created feedback.
 */
async function classifyNewFeedback(
  feedbackId: string,
): Promise<void> {
  try {
    console.log(
      "AUTO CLASSIFICATION START:",
      feedbackId,
    );

    const feedback = await db.feedback.findUnique({
      where: {
        id: feedbackId,
      },
    });

    if (!feedback) {
      console.error(
        "AUTO CLASSIFICATION: feedback not found",
        feedbackId,
      );
      return;
    }

    // Mark as processing
    await db.feedback.update({
      where: {
        id: feedbackId,
      },
      data: {
        classificationStatus: "PROCESSING",
        classificationAttempts: {
          increment: 1,
        },
        classificationError: null,
      },
    });

    console.log(
      "AUTO CLASSIFICATION: calling Gemini",
      feedbackId,
    );

    // Call Gemini
    const classification =
      await classifyFeedback(feedback.content);

    console.log(
      "AUTO CLASSIFICATION RESULT:",
      classification,
    );

    // Store Gemini result
    const updatedFeedback =
      await db.feedback.update({
        where: {
          id: feedbackId,
        },
        data: {
          sentiment: classification.sentiment,
          sentimentScore:
            classification.sentimentScore,
          featureArea:
            classification.featureArea,
          classificationRationale:
            classification.rationale,
          classificationStatus: "COMPLETED",
          classificationError: null,
          classifiedAt: new Date(),
        },
      });

    console.log(
      "AUTO CLASSIFICATION COMPLETED:",
      updatedFeedback.id,
      updatedFeedback.sentiment,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Classification failed";

    console.error(
      "AUTO CLASSIFICATION FAILED:",
      feedbackId,
      message,
    );

    try {
      await db.feedback.update({
        where: {
          id: feedbackId,
        },
        data: {
          classificationStatus: "FAILED",
          classificationError: message,
        },
      });
    } catch (dbError) {
      console.error(
        "Could not save classification error:",
        dbError,
      );
    }
  }
}