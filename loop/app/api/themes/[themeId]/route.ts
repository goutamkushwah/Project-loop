import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { themeIdSchema } from "@/lib/theme-validation";
import { getWorkspaceTheme } from "@/services/theme-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    themeId: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const authorization = await authorizeApi(PERMISSIONS.THEMES_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  const parsedThemeId = themeIdSchema.safeParse(params.themeId);

  if (!parsedThemeId.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The theme identifier is invalid.",
      422,
      { themeId: parsedThemeId.error.flatten().formErrors },
    );
  }

  try {
    const theme = await getWorkspaceTheme(
      authorization.user.workspaceId,
      parsedThemeId.data,
    );

    if (!theme) {
      return apiError(
        "THEME_NOT_FOUND",
        "The requested theme was not found in this workspace.",
        404,
      );
    }

    return apiSuccess({ theme });
  } catch (error: unknown) {
    console.error("Theme detail failed.", error);

    return apiError(
      "THEME_LIST_FAILED",
      "The theme could not be loaded. Please try again.",
      500,
    );
  }
}