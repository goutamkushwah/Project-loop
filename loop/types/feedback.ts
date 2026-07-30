import type { FeedbackChannelValue } from "@/lib/feedback-catalog";

export type FeedbackSentimentValue = "POS" | "NEU" | "NEG";
export type FeedbackStatusValue = "NEW" | "REVIEWED" | "ACTIONED";
export type ClassificationStatusValue =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REVIEW_REQUIRED";

export type FeedbackListItem = {
  id: string;
  content: string;
  channel: FeedbackChannelValue;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: FeedbackSentimentValue | null;
  sentimentScore: number | null;
  featureArea: string | null;
  classificationStatus: ClassificationStatusValue;
  status: FeedbackStatusValue;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackPage = {
  items: FeedbackListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};