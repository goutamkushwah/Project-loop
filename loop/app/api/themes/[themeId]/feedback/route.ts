import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { feedbackListQuerySchema } from "@/lib/feedback-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { themeIdSchema } from "@/lib/theme-validation";
import {
  listWorkspaceThemeFeedback,
  ThemeServiceError,
} from "@/services/theme-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: {
    themeId: string;
  };
};

export async function GET(request: Request, { params }: RouteContext) {
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

  const url = new URL(request.url);
  const parsedQuery = feedbackListQuerySchema.safeParse({
    ...Object.fromEntries(url.searchParams.entries()),
    themeId: parsedThemeId.data,
  });

  if (!parsedQuery.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The theme feedback query is invalid.",
      422,
      parsedQuery.error.flatten().fieldErrors,
    );
  }

  const { themeId: _themeId, ...feedbackQuery } = parsedQuery.data;

  try {
    const result = await listWorkspaceThemeFeedback(
      authorization.user.workspaceId,
      parsedThemeId.data,
      feedbackQuery,
    );

    return apiSuccess(result);
  } catch (error: unknown) {
    if (error instanceof ThemeServiceError) {
      return apiError(error.code, error.message, error.status);
    }

    console.error("Theme feedback drill-down failed.", error);

    return apiError(
      "THEME_FEEDBACK_LIST_FAILED",
      "Theme feedback could not be loaded. Please try again.",
      500,
    );
  }
}