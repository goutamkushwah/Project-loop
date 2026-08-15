import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { trendQuerySchema } from "@/lib/trend-validation";
import { getWorkspaceThemeTrends } from "@/services/trend-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeApi(PERMISSIONS.THEMES_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  const url = new URL(request.url);
  const parsedQuery = trendQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The theme-trends query is invalid.",
      422,
      parsedQuery.error.flatten().fieldErrors,
    );
  }

  try {
    const trends = await getWorkspaceThemeTrends(
      authorization.user.workspaceId,
      parsedQuery.data,
    );

    return apiSuccess(trends);
  } catch (error: unknown) {
    console.error("Theme trends failed.", error);

    return apiError(
      "TREND_ANALYTICS_FAILED",
      "Theme trends could not be loaded. Please try again.",
      500,
    );
  }
}