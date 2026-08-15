import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { feedbackIdSchema } from "@/lib/feedback-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  classifyWorkspaceFeedback,
  FeedbackClassificationServiceError,
} from "@/services/feedback-classification-service";
import { getWorkspaceFeedbackById } from "@/services/feedback-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = {
  params: Promise<{
    feedbackId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { feedbackId } = await params;
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The request origin could not be verified.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.FEEDBACK_UPDATE);

  if (!authorization.ok) {
    return authorization.response;
  }

 const parsedFeedbackId = feedbackIdSchema.safeParse(feedbackId);

  if (!parsedFeedbackId.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The feedback identifier is invalid.",
      422,
      { feedbackId: parsedFeedbackId.error.flatten().formErrors },
    );
  }

  try {
    const classification = await classifyWorkspaceFeedback(
      authorization.user.workspaceId,
      parsedFeedbackId.data,
    );
    const feedback = await getWorkspaceFeedbackById(
      authorization.user.workspaceId,
      parsedFeedbackId.data,
    );

    if (!feedback) {
      return apiError(
        "FEEDBACK_NOT_FOUND",
        "The requested feedback item was not found in this workspace.",
        404,
      );
    }

    return apiSuccess({
      classification,
      feedback,
    });
  } catch (error: unknown) {
    if (error instanceof FeedbackClassificationServiceError) {
      return apiError(error.code, error.message, error.status);
    }

    console.error("Manual feedback classification failed.", error);

    return apiError(
      "FEEDBACK_CLASSIFICATION_FAILED",
      "Feedback classification could not be completed. Please try again.",
      500,
    );
  }
}