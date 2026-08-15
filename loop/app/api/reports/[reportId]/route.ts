import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { reportIdSchema } from "@/lib/report-validation";
import { getWorkspaceReport, ReportServiceError } from "@/services/report-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  const authorization = await authorizeApi(PERMISSIONS.REPORTS_READ);
  if (!authorization.ok) return authorization.response;

  const { reportId } = await context.params;

  const parsedId = reportIdSchema.safeParse(reportId);
  if (!parsedId.success) {
    return apiError("VALIDATION_ERROR", "Report ID must be a valid UUID.", 422);
  }

  try {
    const report = await getWorkspaceReport(authorization.user.workspaceId, parsedId.data);
    if (!report) {
      return apiError("REPORT_NOT_FOUND", "The requested report was not found in this workspace.", 404);
    }
    return apiSuccess({ report });
  } catch (error: unknown) {
    if (error instanceof ReportServiceError) {
      return apiError(error.code, error.message, error.status);
    }
    console.error("Saved report detail failed.", error);
    return apiError("REPORT_LIST_FAILED", "The saved report could not be loaded.", 500);
  }
}