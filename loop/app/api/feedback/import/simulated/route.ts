import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import { simulatedChannelImportSchema } from "@/lib/simulated-channel-validation";
import { importSimulatedChannel } from "@/services/simulated-channel-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 4 * 1024;

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The request origin could not be verified.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.FEEDBACK_CREATE);

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
    return apiError(
      "PAYLOAD_TOO_LARGE",
      "The simulated-channel request is too large.",
      413,
    );
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedInput = simulatedChannelImportSchema.safeParse(payload);

  if (!parsedInput.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Select a valid simulated channel source.",
      422,
      parsedInput.error.flatten().fieldErrors,
    );
  }

  try {
    const summary = await importSimulatedChannel(
      authorization.user.workspaceId,
      parsedInput.data.source,
    );

    return apiSuccess({ summary }, 201);
  } catch (error: unknown) {
    console.error("Simulated channel import failed.", error);

    return apiError(
      "SIMULATED_CHANNEL_IMPORT_FAILED",
      "The simulated channel could not be imported. Please try again.",
      500,
    );
  }
}