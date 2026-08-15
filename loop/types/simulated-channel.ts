import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { SimulatedChannelKey } from "@/lib/simulated-channel-catalog";
import type { FeedbackClassificationBatchSummary } from "@/types/feedback-classification";
import type { FeedbackEmbeddingBatchSummary } from "@/types/embedding";

export type SimulatedChannelImportSummary = {
  batchId: string;
  source: SimulatedChannelKey;
  sourceName: string;
  channel: FeedbackChannelValue;
  totalRows: number;
  importedRows: number;
  classificationQueuedRows: number;
  classification: FeedbackClassificationBatchSummary;
  embedding: FeedbackEmbeddingBatchSummary;
  importedAt: string;
  oldestFeedbackAt: string;
  newestFeedbackAt: string;
};
