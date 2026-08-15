//import "server-only";

import { parse } from "csv-parse/sync";
import { z } from "zod";

import {
  FEEDBACK_CHANNEL_VALUES,
  type FeedbackChannelValue,
} from "@/lib/feedback-catalog";
import { MAX_CSV_DATA_ROWS } from "@/lib/feedback-import-constants";
import type { ApiErrorCode, ApiFieldErrors } from "@/types/api";
import type {
  FeedbackCsvImportError,
  ParsedFeedbackCsv,
  ParsedFeedbackCsvRow,
} from "@/types/feedback-import";

const REQUIRED_HEADERS = ["content", "channel"] as const;
const SUPPORTED_HEADERS = new Set([
  "content",
  "channel",
  "customer_label",
  "source_ref",
  "created_at",
  "sentiment",
  "themes",
]);

const HEADER_LABELS: Record<string, string> = {
  content: "content",
  channel: "channel",
  customer_label: "customer_label",
  source_ref: "source_ref",
  created_at: "created_at",
  sentiment: "sentiment",
  themes: "themes",
};

export class FeedbackCsvFileError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: ApiFieldErrors,
  ) {
    super(message);
    this.name = "FeedbackCsvFileError";
  }
}

function optionalTrimmedString(maximumLength: number, message: string) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(maximumLength, message).optional(),
  );
}

function normalizeChannel(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return FEEDBACK_CHANNEL_VALUES.includes(normalized as FeedbackChannelValue)
    ? normalized
    : value;
}

function isValidIsoDate(value: string): boolean {
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const dateTimePattern =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

  if (!dateOnlyPattern.test(value) && !dateTimePattern.test(value)) {
    return false;
  }

  const datePart = value.slice(0, 10);
  const parsedDatePart = new Date(`${datePart}T00:00:00Z`);

  if (
    Number.isNaN(parsedDatePart.getTime()) ||
    parsedDatePart.toISOString().slice(0, 10) !== datePart
  ) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

const feedbackCsvRowSchema = z.object({
  content: z
    .string({ required_error: "Feedback content is required." })
    .trim()
    .min(3, "Feedback content must contain at least 3 characters.")
    .max(10_000, "Feedback content must contain at most 10,000 characters."),
  channel: z.preprocess(
    normalizeChannel,
    z.enum(FEEDBACK_CHANNEL_VALUES, {
      required_error: "A feedback channel is required.",
      invalid_type_error: "Use a supported feedback channel.",
    }),
  ),
  customer_label: optionalTrimmedString(
    160,
    "Customer label must contain at most 160 characters.",
  ),
  source_ref: optionalTrimmedString(
    255,
    "Source reference must contain at most 255 characters.",
  ),
  created_at: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z
      .string()
      .refine(
        isValidIsoDate,
        "Use an ISO 8601 date such as 2026-07-20 or 2026-07-20T09:30:00Z.",
      )
      .transform((value) => new Date(value))
      .optional(),
  ),
});

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function rowError(
  row: number,
  field: string | null,
  code: FeedbackCsvImportError["code"],
  message: string,
): FeedbackCsvImportError {
  return { row, field, code, message };
}

function validateHeaders(rawHeaders: string[]): string[] {
  const headers = rawHeaders.map(normalizeHeader);
  const duplicateHeaders = headers.filter(
    (header, index) => header.length > 0 && headers.indexOf(header) !== index,
  );
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  const unsupportedHeaders = headers.filter(
    (header) => header.length > 0 && !SUPPORTED_HEADERS.has(header),
  );
  const blankHeaderIndexes = headers
    .map((header, index) => (header.length === 0 ? index + 1 : null))
    .filter((index): index is number => index !== null);

  const fieldErrors: ApiFieldErrors = {};

  if (missingHeaders.length > 0) {
    fieldErrors.headers = [
      `Missing required column${missingHeaders.length === 1 ? "" : "s"}: ${missingHeaders.join(
        ", ",
      )}.`,
    ];
  }

  if (duplicateHeaders.length > 0) {
    fieldErrors.duplicateHeaders = [
      `Duplicate column${duplicateHeaders.length === 1 ? "" : "s"}: ${Array.from(
        new Set(duplicateHeaders),
      ).join(", ")}.`,
    ];
  }

  if (unsupportedHeaders.length > 0) {
    fieldErrors.unsupportedHeaders = [
      `Unsupported column${unsupportedHeaders.length === 1 ? "" : "s"}: ${Array.from(
        new Set(unsupportedHeaders),
      ).join(", ")}.`,
    ];
  }

  if (blankHeaderIndexes.length > 0) {
    fieldErrors.blankHeaders = [
      `Column header${blankHeaderIndexes.length === 1 ? "" : "s"} ${blankHeaderIndexes.join(
        ", ",
      )} must not be blank.`,
    ];
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new FeedbackCsvFileError(
      "CSV_HEADER_INVALID",
      "The CSV header row is invalid.",
      422,
      fieldErrors,
    );
  }

  return headers;
}

function mapRecord(headers: string[], values: string[]): Record<string, string> {
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
}

function formatIssueField(issuePath: PropertyKey[]): string | null {
  const field = issuePath[0];
  return typeof field === "string" ? HEADER_LABELS[field] ?? field : null;
}

export function parseFeedbackCsv(csvText: string): ParsedFeedbackCsv {
  let records: string[][];

  try {
    records = parse(csvText, {
      bom: true,
      delimiter: ",",
      encoding: "utf8",
      max_record_size: 64_000,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: false,
    }) as string[][];
  } catch {
    throw new FeedbackCsvFileError(
      "CSV_PARSE_FAILED",
      "The CSV file is malformed. Check its delimiter, quotation marks, and row structure.",
      422,
    );
  }

  if (records.length === 0) {
    throw new FeedbackCsvFileError(
      "CSV_EMPTY",
      "The CSV file is empty and does not contain a header row.",
      422,
    );
  }

  const [rawHeaders, ...dataRows] = records;
  const headers = validateHeaders(rawHeaders);

  if (dataRows.length === 0) {
    throw new FeedbackCsvFileError(
      "CSV_EMPTY",
      "The CSV file does not contain any feedback rows.",
      422,
    );
  }

  if (dataRows.length > MAX_CSV_DATA_ROWS) {
    throw new FeedbackCsvFileError(
      "CSV_ROW_LIMIT_EXCEEDED",
      `A single import can contain at most ${MAX_CSV_DATA_ROWS.toLocaleString()} feedback rows.`,
      413,
    );
  }

  const validRows: ParsedFeedbackCsvRow[] = [];
  const errors: FeedbackCsvImportError[] = [];

  dataRows.forEach((values, dataIndex) => {
    const rowNumber = dataIndex + 2;

    if (values.length !== headers.length) {
      errors.push(
        rowError(
          rowNumber,
          null,
          "COLUMN_COUNT_MISMATCH",
          `Expected ${headers.length} columns but found ${values.length}.`,
        ),
      );
      return;
    }

    const record = mapRecord(headers, values);
    const aiFieldErrors = ["sentiment", "themes"].filter(
      (field) => (record[field] ?? "").trim().length > 0,
    );

    if (aiFieldErrors.length > 0) {
      aiFieldErrors.forEach((field) => {
        errors.push(
          rowError(
            rowNumber,
            field,
            "INVALID_AI_FIELD",
            `${field} must be blank because LOOP classification owns this field.`,
          ),
        );
      });
      return;
    }

    const parsedRow = feedbackCsvRowSchema.safeParse(record);

    if (!parsedRow.success) {
      parsedRow.error.issues.forEach((issue) => {
        errors.push(
          rowError(
            rowNumber,
            formatIssueField(issue.path),
            "INVALID_FIELD",
            issue.message,
          ),
        );
      });
      return;
    }

    validRows.push({
      rowNumber,
      content: parsedRow.data.content,
      channel: parsedRow.data.channel,
      customerLabel: parsedRow.data.customer_label ?? null,
      sourceRef: parsedRow.data.source_ref ?? null,
      createdAt: parsedRow.data.created_at ?? null,
    });
  });

  return {
    totalRows: dataRows.length,
    validRows,
    errors,
  };
}