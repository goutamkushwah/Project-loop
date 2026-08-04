import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { feedbackIdSchema } from "@/lib/feedback-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import { classifyFeedbackItem, ClassificationServiceError } from "@/services/classification-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClassifyRouteContext = {
  params: Promise<{
    feedbackId: string;
  }>;
};

export async function POST(request: Request, context: ClassifyRouteContext) {
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

  try {
    await classifyFeedbackItem(authorization.user.workspaceId, parsedFeedbackId.data);

    return apiSuccess({ feedbackId: parsedFeedbackId.data, status: "classified" });
  } catch (error: unknown) {
    if (error instanceof ClassificationServiceError) {
      return apiError("CLASSIFICATION_FAILED", error.message, 404);
    }

    console.error("Feedback classification failed.", error);

    return apiError(
      "CLASSIFICATION_FAILED",
      "Feedback could not be classified right now. Please try again.",
      500,
    );
  }
}
