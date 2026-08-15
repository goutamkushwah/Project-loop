import { apiError, apiSuccess } from "@/lib/api-response";
import { authorizeApi } from "@/lib/authorization";
import { FeedbackCsvFileError, parseFeedbackCsv } from "@/lib/feedback-csv";
import { MAX_CSV_FILE_BYTES } from "@/lib/feedback-import-constants";
import { PERMISSIONS } from "@/lib/rbac";
import { isTrustedMutationRequest } from "@/lib/request-security";
import { importWorkspaceFeedbackCsv } from "@/services/feedback-import-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_MULTIPART_REQUEST_BYTES = MAX_CSV_FILE_BYTES + 256 * 1024;
const ALLOWED_CSV_CONTENT_TYPES = new Set([
  "",
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
]);

function hasCsvExtension(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".csv");
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    return apiError(
      "CROSS_SITE_REQUEST_BLOCKED",
      "The request origin could not be verified.",
      403,
    );
  }

  const authorization = await authorizeApi(PERMISSIONS.FEEDBACK_CREATE);

  if (!authorization.ok) {
    return authorization.response;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return apiError(
      "INVALID_CONTENT_TYPE",
      "Content-Type must be multipart/form-data.",
      415,
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_MULTIPART_REQUEST_BYTES
  ) {
    return apiError(
      "PAYLOAD_TOO_LARGE",
      "The CSV upload exceeds the 5 MB limit.",
      413,
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return apiError(
      "CSV_FILE_INVALID",
      "The multipart upload could not be read.",
      400,
    );
  }

  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return apiError("CSV_FILE_REQUIRED", "Select a CSV file to import.", 422, {
      file: ["A CSV file is required."],
    });
  }

  if (!hasCsvExtension(file.name)) {
    return apiError(
      "CSV_FILE_INVALID",
      "The uploaded file must use the .csv extension.",
      422,
      {
        file: ["Select a file ending in .csv."],
      },
    );
  }

  if (!ALLOWED_CSV_CONTENT_TYPES.has(file.type.toLowerCase())) {
    return apiError(
      "CSV_FILE_INVALID",
      "The uploaded file does not have a supported CSV content type.",
      422,
      {
        file: ["Select a plain UTF-8 CSV file."],
      },
    );
  }

  if (file.size === 0) {
    return apiError("CSV_EMPTY", "The uploaded CSV file is empty.", 422, {
      file: ["Select a non-empty CSV file."],
    });
  }

  if (file.size > MAX_CSV_FILE_BYTES) {
    return apiError(
      "CSV_FILE_TOO_LARGE",
      "The CSV file exceeds the 5 MB limit.",
      413,
      {
        file: ["Select a CSV file no larger than 5 MB."],
      },
    );
  }

  let csvText: string;

  try {
    const bytes = await file.arrayBuffer();
    csvText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return apiError(
      "CSV_FILE_INVALID",
      "The CSV file must use valid UTF-8 encoding.",
      422,
      {
        file: ["Save the file as UTF-8 CSV and upload it again."],
      },
    );
  }

  try {
    const parsedCsv = parseFeedbackCsv(csvText);
    const summary = await importWorkspaceFeedbackCsv(
      authorization.user.workspaceId,
      file.name,
      parsedCsv,
    );

    return apiSuccess(
      { summary },
      summary.failedRows === 0 && summary.importedRows > 0 ? 201 : 200,
    );
  } catch (error: unknown) {
    if (error instanceof FeedbackCsvFileError) {
      return apiError(error.code, error.message, error.status, error.fieldErrors);
    }

    console.error("CSV feedback import failed.", error);

    return apiError(
      "CSV_IMPORT_FAILED",
      "The CSV import could not be completed. Please try again.",
      500,
    );
  }
}