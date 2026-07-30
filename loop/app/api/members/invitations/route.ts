import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { invitationCreateSchema } from "@/lib/member-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  createWorkspaceInvitation,
  listWorkspaceInvitations,
  WorkspaceMemberServiceError,
} from "@/services/member-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 4 * 1024;

export async function GET() {
  const authorization = await authorizeApi(PERMISSIONS.MEMBERS_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  try {
    const invitations = await listWorkspaceInvitations(authorization.user.workspaceId);
    return apiSuccess(invitations);
  } catch (error: unknown) {
    console.error("Failed to list workspace invitations.", error);

    return apiError(
      "INTERNAL_SERVER_ERROR",
      "Workspace invitations could not be loaded.",
      500,
    );
  }
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The cross-site invitation request was blocked.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.MEMBERS_MANAGE);

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

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Invitation payload is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedInput = invitationCreateSchema.safeParse(payload);

  if (!parsedInput.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Review the highlighted invitation fields.",
      422,
      parsedInput.error.flatten().fieldErrors,
    );
  }

  try {
    const result = await createWorkspaceInvitation(
      authorization.user.workspaceId,
      authorization.user.id,
      parsedInput.data,
    );
    const invitationUrl = new URL(`/invite/${result.token}`, request.url).toString();

    return apiSuccess(
      {
        invitation: result.invitation,
        invitationUrl,
      },
      201,
    );
  } catch (error: unknown) {
    if (error instanceof WorkspaceMemberServiceError) {
      return apiError(error.code, error.message, error.status, error.fieldErrors);
    }

    console.error("Failed to create workspace invitation.", error);

    return apiError(
      "INVITATION_CREATE_FAILED",
      "The workspace invitation could not be created.",
      500,
    );
  }
}