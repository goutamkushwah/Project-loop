export type FeedbackClassificationRunStatus =
  | "COMPLETED"
  | "REVIEW_REQUIRED"
  | "FAILED";

export type FeedbackClassificationRunResult = {
  feedbackId: string;
  status: FeedbackClassificationRunStatus;
  attempts: number;
  provider: "GOOGLE_GEMINI";
  model: string;
  message: string | null;
};

export type FeedbackClassificationBatchSummary = {
  requestedRows: number;
  claimedRows: number;
  completedRows: number;
  reviewRequiredRows: number;
  failedRows: number;
  skippedRows: number;
};