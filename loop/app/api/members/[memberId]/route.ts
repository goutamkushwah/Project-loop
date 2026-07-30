import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { memberIdSchema, memberUpdateSchema } from "@/lib/member-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  updateWorkspaceMember,
  WorkspaceMemberServiceError,
} from "@/services/member-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 4 * 1024;

type MemberRouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: MemberRouteContext,
) {
  const { memberId } = await context.params;
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The cross-site member update was blocked.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.MEMBERS_MANAGE);

  if (!authorization.ok) {
    return authorization.response;
  }

 const parsedMemberId = memberIdSchema.safeParse(memberId);

  if (!parsedMemberId.success) {
    return apiError("VALIDATION_ERROR", "The member identifier is invalid.", 422);
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
    return apiError("PAYLOAD_TOO_LARGE", "Member update payload is too large.", 413);
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsedInput = memberUpdateSchema.safeParse(payload);

  if (!parsedInput.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The member update is invalid.",
      422,
      parsedInput.error.flatten().fieldErrors,
    );
  }

  try {
    const member = await updateWorkspaceMember(
      authorization.user.workspaceId,
      authorization.user.id,
      parsedMemberId.data,
      parsedInput.data,
    );

    return apiSuccess({ member });
  } catch (error: unknown) {
    if (error instanceof WorkspaceMemberServiceError) {
      return apiError(error.code, error.message, error.status, error.fieldErrors);
    }

    console.error("Failed to update workspace member.", error);

    return apiError(
      "MEMBER_UPDATE_FAILED",
      "The workspace member could not be updated.",
      500,
    );
  }
}