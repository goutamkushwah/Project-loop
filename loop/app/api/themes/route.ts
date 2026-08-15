import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { themeListQuerySchema } from "@/lib/theme-validation";
import { listWorkspaceThemes } from "@/services/theme-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeApi(PERMISSIONS.THEMES_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  const url = new URL(request.url);
  const parsedQuery = themeListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The theme-list query is invalid.",
      422,
      parsedQuery.error.flatten().fieldErrors,
    );
  }

  try {
    const page = await listWorkspaceThemes(
      authorization.user.workspaceId,
      parsedQuery.data,
    );

    return apiSuccess(page);
  } catch (error: unknown) {
    console.error("Theme list failed.", error);

    return apiError(
      "THEME_LIST_FAILED",
      "Themes could not be loaded. Please try again.",
      500,
    );
  }
}