import type {
  FeedbackSentimentValue,
  FeedbackStatusValue,
} from "@/types/feedback";

export const FEEDBACK_SENTIMENT_VALUES = ["POS", "NEU", "NEG"] as const;
export const FEEDBACK_STATUS_VALUES = ["NEW", "REVIEWED", "ACTIONED"] as const;

export const FEEDBACK_SENTIMENTS: readonly {
  value: FeedbackSentimentValue;
  label: string;
}[] = [
  { value: "POS", label: "Positive" },
  { value: "NEU", label: "Neutral" },
  { value: "NEG", label: "Negative" },
];

export const FEEDBACK_STATUSES: readonly {
  value: FeedbackStatusValue;
  label: string;
}[] = [
  { value: "NEW", label: "New" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACTIONED", label: "Actioned" },
];

const sentimentLabelMap = new Map<FeedbackSentimentValue, string>(
  FEEDBACK_SENTIMENTS.map((sentiment) => [sentiment.value, sentiment.label]),
);

const statusLabelMap = new Map<FeedbackStatusValue, string>(
  FEEDBACK_STATUSES.map((status) => [status.value, status.label]),
);

export function getFeedbackSentimentLabel(sentiment: FeedbackSentimentValue): string {
  return sentimentLabelMap.get(sentiment) ?? sentiment;
}

export function getFeedbackStatusLabel(status: FeedbackStatusValue): string {
  return statusLabelMap.get(status) ?? status;
}