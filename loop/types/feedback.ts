import type { FeedbackChannelValue } from "@/lib/feedback-catalog";

export type FeedbackSentimentValue = "POS" | "NEU" | "NEG";
export type FeedbackStatusValue = "NEW" | "REVIEWED" | "ACTIONED";
export type ClassificationStatusValue =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REVIEW_REQUIRED";

export type FeedbackSortOrder = "asc" | "desc";

export type FeedbackThemeOption = {
  id: string;
  name: string;
  color: string;
};

export type FeedbackThemeAssignment = FeedbackThemeOption & {
  confidence: number;
};

export type FeedbackQueryState = {
  search: string;
  channel: FeedbackChannelValue | null;
  sentiment: FeedbackSentimentValue | null;
  themeId: string | null;
  status: FeedbackStatusValue | null;
  dateFrom: string | null;
  dateTo: string | null;
  sortOrder: FeedbackSortOrder;
};

export type FeedbackListItem = {
  id: string;
  content: string;
  channel: FeedbackChannelValue;
  sourceRef: string | null;
  customerLabel: string | null;
  sentiment: FeedbackSentimentValue | null;
  sentimentScore: number | null;
  featureArea: string | null;
  themes: FeedbackThemeAssignment[];
  classificationRationale: string | null;
  classificationStatus: ClassificationStatusValue;
  classificationAttempts: number;
  classificationError: string | null;
  classifiedAt: string | null;
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
  query: FeedbackQueryState;
};

export type FeedbackStatusUpdateResult = {
  feedback: FeedbackListItem;
  previousStatus: FeedbackStatusValue;
  changed: boolean;
};