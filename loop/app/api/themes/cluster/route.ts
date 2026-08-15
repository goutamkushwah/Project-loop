import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import { themeClusterRequestSchema } from "@/lib/theme-validation";
import { clusterWorkspaceFeedbackThemes } from "@/services/theme-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_REQUEST_BYTES = 4 * 1024;

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The request origin could not be verified.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.THEMES_CLUSTER);

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
    return apiError("PAYLOAD_TOO_LARGE", "Theme clustering payload is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedRequest = themeClusterRequestSchema.safeParse(payload);

  if (!parsedRequest.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The theme clustering request is invalid.",
      422,
      parsedRequest.error.flatten().fieldErrors,
    );
  }

  try {
    const summary = await clusterWorkspaceFeedbackThemes(
      authorization.user.workspaceId,
      parsedRequest.data.limit,
    );

    return apiSuccess({ summary });
  } catch (error: unknown) {
    console.error("Theme clustering failed.", error);

    return apiError(
      "THEME_CLUSTER_FAILED",
      "Theme clustering could not be completed. Please try again.",
      500,
    );
  }
}