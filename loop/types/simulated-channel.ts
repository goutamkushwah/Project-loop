import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { SimulatedChannelKey } from "@/lib/simulated-channel-catalog";

export type SimulatedChannelImportSummary = {
  batchId: string;
  source: SimulatedChannelKey;
  sourceName: string;
  channel: FeedbackChannelValue;
  totalRows: number;
  importedRows: number;
  classificationQueuedRows: number;
  importedAt: string;
  oldestFeedbackAt: string;
  newestFeedbackAt: string;
};