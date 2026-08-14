import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { dashboardQuerySchema } from "@/lib/dashboard-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { getWorkspaceDashboardTrends } from "@/services/dashboard-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeApi(PERMISSIONS.DASHBOARD_READ);

  if (!authorization.ok) {
    return authorization.response;
  }

  const url = new URL(request.url);
  const parsedQuery = dashboardQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!parsedQuery.success) {
    return apiError(
      "VALIDATION_ERROR",
      "The dashboard trends query is invalid.",
      422,
      parsedQuery.error.flatten().fieldErrors,
    );
  }

  try {
    const trends = await getWorkspaceDashboardTrends(
      authorization.user.workspaceId,
      parsedQuery.data,
    );

    return apiSuccess(trends);
  } catch (error: unknown) {
    console.error("Dashboard trends failed.", error);

    return apiError(
      "DASHBOARD_ANALYTICS_FAILED",
      "Trend data could not be loaded. Please try again.",
      500,
    );
  }
}