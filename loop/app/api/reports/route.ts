import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { createReportSchema, reportListQuerySchema } from "@/lib/report-validation";
import { isTrustedMutationRequest } from "@/lib/request-security";
import {
  generateWorkspaceVoiceOfCustomerReport,
  listWorkspaceReports,
  ReportServiceError,
} from "@/services/report-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_REQUEST_BYTES = 8 * 1024;

export async function GET(request: Request) {
  const authorization = await authorizeApi(PERMISSIONS.REPORTS_READ);
  if (!authorization.ok) return authorization.response;

  const url = new URL(request.url);
  const parsed = reportListQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    periodFrom: url.searchParams.get("periodFrom") ?? undefined,
    periodTo: url.searchParams.get("periodTo") ?? undefined,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortOrder: url.searchParams.get("sortOrder") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Review the saved-report query parameters.", 422, parsed.error.flatten().fieldErrors);
  }

  try {
    const reports = await listWorkspaceReports(authorization.user.workspaceId, parsed.data);
    return apiSuccess({ reports });
  } catch (error: unknown) {
    console.error("Saved report list failed.", error);
    return apiError("REPORT_LIST_FAILED", "Saved reports could not be loaded.", 500);
  }
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return apiError("CROSS_SITE_REQUEST_BLOCKED", "The request origin could not be verified.", 403);
  }

  const authorization = await authorizeApi(PERMISSIONS.REPORTS_CREATE);
  if (!authorization.ok) return authorization.response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return apiError("INVALID_CONTENT_TYPE", "Content-Type must be application/json.", 415);
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return apiError("INVALID_JSON", "Request body could not be read.", 400);
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return apiError("PAYLOAD_TOO_LARGE", "Report generation request is too large.", 413);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return apiError("INVALID_JSON", "Request body must contain valid JSON.", 400);
  }

  const parsed = createReportSchema.safeParse(payload);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Review the Voice-of-Customer report period.", 422, parsed.error.flatten().fieldErrors);
  }

  try {
    const report = await generateWorkspaceVoiceOfCustomerReport(
      authorization.user.workspaceId,
      authorization.user.id,
      parsed.data,
    );
    return apiSuccess({ report }, 201);
  } catch (error: unknown) {
    if (error instanceof ReportServiceError) {
      return apiError(error.code, error.message, error.status);
    }

    console.error("Voice-of-Customer report generation failed.", error);
    return apiError("REPORT_GENERATE_FAILED", "The Voice-of-Customer report could not be generated.", 500);
  }
}