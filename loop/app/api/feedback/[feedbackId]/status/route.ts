import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { feedbackIdSchema, feedbackStatusUpdateSchema } from "@/lib/feedback-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import { FeedbackServiceError, updateWorkspaceFeedbackStatus } from "@/services/feedback-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 2 * 1024;

type FeedbackStatusRouteContext = {
  params: Promise<{
    feedbackId: string;
  }>;
};

export async function PATCH(request: Request, context: FeedbackStatusRouteContext) {
  if (!isTrustedMutationRequest(request)) {
    return apiError("CROSS_SITE_REQUEST_BLOCKED", "The request origin could not be verified.", 403);
  }

  const authorization = await authorizeApi(PERMISSIONS.FEEDBACK_UPDATE);

  if (!authorization.ok) {
    return authorization.response;
  }

  const { feedbackId } = await context.params;

  const parsedFeedbackId = feedbackIdSchema.safeParse(feedbackId);

  if (!parsedFeedbackId.success) {
    return apiError("VALIDATION_ERROR", "The feedback identifier is invalid.", 422, {
      feedbackId: parsedFeedbackId.error.flatten().formErrors,
    });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return apiError("INVALID_CONTENT_TYPE", "Content-Type must be application/json.", 415);
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return apiError("INVALID_JSON", "Request body could not be read.", 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Status-update payload is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedStatus = feedbackStatusUpdateSchema.safeParse(payload);

  if (!parsedStatus.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Select a valid next feedback status.",
      422,
      parsedStatus.error.flatten().fieldErrors,
    );
  }

  try {
    const result = await updateWorkspaceFeedbackStatus(
      authorization.user.workspaceId,
      parsedFeedbackId.data,
      parsedStatus.data,
    );

    return apiSuccess(result);
  } catch (error: unknown) {
    if (error instanceof FeedbackServiceError) {
      return apiError(error.code, error.message, error.status, error.fieldErrors);
    }

    console.error("Feedback status update failed.", error);

    return apiError(
      "FEEDBACK_UPDATE_FAILED",
      "The feedback status could not be updated. Please try again.",
      500,
    );
  }
}
