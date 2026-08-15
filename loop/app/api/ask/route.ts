import { apiError, apiSuccess } from "@/lib/api-response";
import { askLoopRequestSchema } from "@/lib/ask-validation";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import { askLoop, AskLoopServiceError } from "@/services/ask-loop-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_REQUEST_BYTES = 8 * 1024;

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The request origin could not be verified.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.ASK_LOOP_QUERY);

  if (!authorization.ok) {
    return authorization.response;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
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
    return apiError("INVALID_JSON", "Request body could not be read.", 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Ask LOOP request is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedInput = askLoopRequestSchema.safeParse(payload);

  if (!parsedInput.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Review the Ask LOOP question.",
      422,
      parsedInput.error.flatten().fieldErrors,
    );
  }

  try {
    const answer = await askLoop(authorization.user.workspaceId, parsedInput.data);
    return apiSuccess({ answer });
  } catch (error: unknown) {
    if (error instanceof AskLoopServiceError) {
      return apiError(error.code, error.message, error.status);
    }

    console.error("Ask LOOP request failed.", error);
    return apiError(
      "ASK_LOOP_FAILED",
      "Ask LOOP could not complete the request. Please try again.",
      500,
    );
  }
}