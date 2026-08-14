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
  volume: DashboardVolumePoint[];
  sentiment: DashboardSentimentPoint[];
  topThemes: DashboardThemePoint[];
};

export type TrendSeriesPoint = {
  date: string;
  label: string;
  count: number;
};

export type ThemeTrendSeries = {
  id: string;
  name: string;
  color: string;
  points: TrendSeriesPoint[];
  totalCount: number;
};

export type TrendSpike = {
  themeId: string;
  themeName: string;
  color: string;
  date: string;
  label: string;
  count: number;
  baselineAverage: number;
  percentageIncrease: number;
};

export type DashboardTrendsData = {
  period: {
    dateFrom: string;
    dateTo: string;
    dayCount: number;
  };
  themeSeries: ThemeTrendSeries[];
  spikes: TrendSpike[];
};