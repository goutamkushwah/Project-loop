export type FeedbackEmbeddingBatchSummary = {
  requestedRows: number;
  completedRows: number;
  failedRows: number;
  provider: "GOOGLE_GEMINI";
  model: string;
  dimensions: number;
};

export type WorkspaceEmbeddingCoverage = {
  totalFeedback: number;
  embeddedFeedback: number;
  missingFeedback: number;
  coveragePercentage: number;
  model: string;
  dimensions: number;
};