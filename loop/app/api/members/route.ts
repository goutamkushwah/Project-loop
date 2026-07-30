import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { memberListQuerySchema } from "@/lib/member-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { listWorkspaceMembers } from "@/services/member-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeApi(PERMISSIONS.MEMBERS_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  const query = memberListQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );

  if (!query.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The member-list query is invalid.",
      422,
      query.error.flatten().fieldErrors,
    );
  }

  try {
    const members = await listWorkspaceMembers(
      authorization.user.workspaceId,
      authorization.user.id,
      query.data,
    );

    return apiSuccess(members);
  } catch (error: unknown) {
    console.error("Failed to list workspace members.", error);

    return apiError(
      "INTERNAL_SERVER_ERROR",
      "Workspace members could not be loaded.",
      500,
    );
  }
}