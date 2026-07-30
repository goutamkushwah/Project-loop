import { apiError, apiSuccess } from "@/lib/api-response";
import {
  invitationAcceptSchema,
  invitationTokenSchema,
} from "@/lib/member-validation";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  acceptWorkspaceInvitation,
  getInvitationSummary,
  WorkspaceMemberServiceError,
} from "@/services/member-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 8 * 1024;

type InvitationTokenRouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  _request: Request,
  context: InvitationTokenRouteContext,
) {
  const { token } = await context.params;

  const parsedToken = invitationTokenSchema.safeParse(token);

  if (!parsedToken.success) {
    return apiError("INVITATION_NOT_FOUND", "This invitation could not be found.", 404);
  }

  try {
    const invitation = await getInvitationSummary(parsedToken.data);

    if (invitation.state === "NOT_FOUND") {
      return apiError("INVITATION_NOT_FOUND", "This invitation could not be found.", 404);
    }

    return apiSuccess({ invitation });
  } catch (error: unknown) {
    console.error("Failed to load invitation.", error);

    return apiError(
      "INTERNAL_SERVER_ERROR",
      "The invitation could not be loaded.",
      500,
    );
  }
}

export async function POST(
  request: Request,
  context: InvitationTokenRouteContext,
) {
  const { token } = await context.params;
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The cross-site invitation acceptance was blocked.",
      403,
    );
  }

 const parsedToken = invitationTokenSchema.safeParse(token);

  if (!parsedToken.success) {
    return apiError("INVITATION_NOT_FOUND", "This invitation could not be found.", 404);
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
    return apiError("PAYLOAD_TOO_LARGE", "Invitation acceptance payload is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedInput = invitationAcceptSchema.safeParse(payload);

  if (!parsedInput.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Review the highlighted account fields.",
      422,
      parsedInput.error.flatten().fieldErrors,
    );
  }

  try {
    const result = await acceptWorkspaceInvitation(parsedToken.data, parsedInput.data);
    return apiSuccess(result, 201);
  } catch (error: unknown) {
    if (error instanceof WorkspaceMemberServiceError) {
      return apiError(error.code, error.message, error.status, error.fieldErrors);
    }

    console.error("Failed to accept workspace invitation.", error);

    return apiError(
      "INVITATION_ACCEPT_FAILED",
      "The invitation could not be accepted.",
      500,
    );
  }
}