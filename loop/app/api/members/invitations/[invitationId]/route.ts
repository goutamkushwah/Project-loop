import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { invitationIdSchema } from "@/lib/member-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  revokeWorkspaceInvitation,
  WorkspaceMemberServiceError,
} from "@/services/member-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InvitationRouteContext = {
  params: {
    invitationId: string;
  };
};

export async function DELETE(request: Request, context: InvitationRouteContext) {
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

  const parsedInvitationId = invitationIdSchema.safeParse(context.params.invitationId);

  if (!parsedInvitationId.success) {
    return apiError("VALIDATION_ERROR", "The invitation identifier is invalid.", 422);
  }

  try {
    await revokeWorkspaceInvitation(
      authorization.user.workspaceId,
      parsedInvitationId.data,
    );

    return apiSuccess({ revoked: true });
  } catch (error: unknown) {
    if (error instanceof WorkspaceMemberServiceError) {
      return apiError(error.code, error.message, error.status, error.fieldErrors);
    }

    console.error("Failed to revoke workspace invitation.", error);

    return apiError(
      "INVITATION_REVOKE_FAILED",
      "The workspace invitation could not be revoked.",
      500,
    );
  }
}
