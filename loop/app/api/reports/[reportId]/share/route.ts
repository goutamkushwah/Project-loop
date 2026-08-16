import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { reportIdSchema } from "@/lib/report-validation";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  ReportServiceError,
  revokeWorkspaceReportShare,
  rotateWorkspaceReportShare,
} from "@/services/report-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

function invalidReportIdResponse() {
  return apiError("VALIDATION_ERROR", "Report ID must be a valid UUID.", 422);
}

function handleServiceError(error: unknown) {
  if (error instanceof ReportServiceError) {
    return apiError(error.code, error.message, error.status);
  }

  console.error("Report sharing operation failed.", error);
  return apiError(
    "REPORT_SHARE_FAILED",
    "The report sharing setting could not be updated. Please try again.",
    500,
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  const routeParams = await params;

  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The cross-site report sharing request was blocked.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.REPORTS_SHARE);
  if (!authorization.ok) {
    return authorization.response;
  }

  const parsedId = reportIdSchema.safeParse(routeParams.reportId);
  if (!parsedId.success) {
    return invalidReportIdResponse();
  }

  try {
    const share = await rotateWorkspaceReportShare(
      authorization.user.workspaceId,
      parsedId.data,
    );

    const shareUrl = new URL(
      `/shared/reports/${share.token}`,
      request.url,
    ).toString();

    return apiSuccess(
      {
        share: {
          reportId: parsedId.data,
          shareUrl,
          createdAt: share.createdAt,
        },
      },
      201,
    );
  } catch (error: unknown) {
    return handleServiceError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const routeParams = await params;
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The cross-site report sharing request was blocked.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.REPORTS_SHARE);
  if (!authorization.ok) {
    return authorization.response;
  }

 const parsedId = reportIdSchema.safeParse(routeParams.reportId);
  if (!parsedId.success) {
    return invalidReportIdResponse();
  }

  try {
    await revokeWorkspaceReportShare(authorization.user.workspaceId, parsedId.data);

    return apiSuccess({
      share: {
        reportId: parsedId.data,
        enabled: false,
        createdAt: null,
      },
    });
  } catch (error: unknown) {
    return handleServiceError(error);
  }
}