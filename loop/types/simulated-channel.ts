import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { SimulatedChannelKey } from "@/lib/simulated-channel-catalog";
import type { FeedbackClassificationBatchSummary } from "@/types/feedback-classification";

export type SimulatedChannelImportSummary = {
  batchId: string;
  source: SimulatedChannelKey;
  sourceName: string;
  channel: FeedbackChannelValue;
  totalRows: number;
  importedRows: number;
  classificationQueuedRows: number;
  classification: FeedbackClassificationBatchSummary;
  importedAt: string;
  oldestFeedbackAt: string;
  newestFeedbackAt: string;
};