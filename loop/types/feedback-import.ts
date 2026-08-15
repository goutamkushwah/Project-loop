import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { FeedbackClassificationBatchSummary } from "@/types/feedback-classification";
import type { FeedbackEmbeddingBatchSummary } from "@/types/embedding";

export type FeedbackCsvImportErrorCode =
  | "COLUMN_COUNT_MISMATCH"
  | "DUPLICATE_SOURCE_REFERENCE"
  | "EXISTING_SOURCE_REFERENCE"
  | "INVALID_AI_FIELD"
  | "INVALID_FIELD"
  | "IMPORT_CONFLICT";

export type FeedbackCsvImportError = {
  row: number;
  field: string | null;
  code: FeedbackCsvImportErrorCode;
  message: string;
};

export type ParsedFeedbackCsvRow = {
  rowNumber: number;
  content: string;
  channel: FeedbackChannelValue;
  customerLabel: string | null;
  sourceRef: string | null;
  createdAt: Date | null;
};

export type ParsedFeedbackCsv = {
  totalRows: number;
  validRows: ParsedFeedbackCsvRow[];
  errors: FeedbackCsvImportError[];
};

export type FeedbackCsvImportSummary = {
  fileName: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  classificationQueuedRows: number;
  classification: FeedbackClassificationBatchSummary;
  embedding: FeedbackEmbeddingBatchSummary;
  errors: FeedbackCsvImportError[];
  truncatedErrorCount: number;
};