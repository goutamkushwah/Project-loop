import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { FeedbackStatusValue } from "@/types/feedback";

export type DashboardQueryState = {
  dateFrom: string;
  dateTo: string;
  channel: FeedbackChannelValue | null;
  status: FeedbackStatusValue | null;
};

export type DashboardStatSummary = {
  totalItems: number;
  classifiedItems: number;
  negativeItems: number;
  negativePercentage: number;
  newThisWeek: number;
  classificationCoverage: number;
};

export type DashboardAiSummary = {
  completedClassifications: number;
  pendingClassifications: number;
  processingClassifications: number;
  failedClassifications: number;
  reviewRequiredClassifications: number;
  averageSentimentScore: number | null;
  themeAssignedItems: number;
  themeCoverage: number;
};

export type DashboardVolumePoint = {
  date: string;
  label: string;
  count: number;
};

export type DashboardSentimentPoint = {
  sentiment: "POS" | "NEU" | "NEG";
  label: string;
  count: number;
  percentage: number;
};

export type DashboardThemePoint = {
  id: string;
  name: string;
  color: string;
  count: number;
  percentage: number;
};

export type DashboardAnalyticsData = {
  query: DashboardQueryState;
  period: {
    dateFrom: string;
    dateTo: string;
    dayCount: number;
  };
  stats: DashboardStatSummary;
  ai: DashboardAiSummary;
  volume: DashboardVolumePoint[];
  sentiment: DashboardSentimentPoint[];
  topThemes: DashboardThemePoint[];
};