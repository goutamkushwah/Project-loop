import { apiError, apiSuccess } from "@/lib/api-response";
import { classificationPreviewInputSchema } from "@/lib/ai-validation";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  AiServiceError,
  classifyFeedbackPreview,
} from "@/services/ai-classification-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const authorization = await authorizeApi(PERMISSIONS.AI_CLASSIFY);

  if (!authorization.ok) {
    return authorization.response;
  }

  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "Cross-site classification requests are not allowed.",
      403,
    );
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return apiError(
      "INVALID_CONTENT_TYPE",
      "Content-Type must be application/json.",
      415,
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Classification payload is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedPayload = classificationPreviewInputSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Review the feedback content before classification.",
      422,
      parsedPayload.error.flatten().fieldErrors,
    );
  }

  try {
    const result = await classifyFeedbackPreview({
      workspaceId: authorization.user.workspaceId,
      userId: authorization.user.id,
      content: parsedPayload.data.content,
    });

    return apiSuccess(result);
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      return apiError(error.code, error.message, error.status);
    }

    console.error("Unexpected classification preview failure.", error);

    return apiError(
      "AI_REQUEST_FAILED",
      "The classification request could not be completed.",
      502,
    );
  }
}