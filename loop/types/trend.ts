import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { FeedbackStatusValue } from "@/types/feedback";

export type TrendQueryState = {
  dateFrom: string;
  dateTo: string;
  channel: FeedbackChannelValue | null;
  status: FeedbackStatusValue | null;
};

export type TrendPeriod = {
  dateFrom: string;
  dateTo: string;
  dayCount: number;
};

export type TrendThemeSummary = {
  id: string;
  name: string;
  color: string;
  currentCount: number;
  previousCount: number;
  absoluteChange: number;
  percentageChange: number | null;
  isSpiking: boolean;
};

export type TrendSeriesTheme = {
  id: string;
  name: string;
  color: string;
  seriesKey: string;
  currentCount: number;
};

export type TrendVolumePoint = {
  date: string;
  label: string;
  [seriesKey: string]: string | number;
};

export type TrendSummary = {
  activeThemes: number;
  spikingThemes: number;
  currentAssignments: number;
  previousAssignments: number;
};

export type TrendAnalyticsData = {
  query: TrendQueryState;
  currentPeriod: TrendPeriod;
  previousPeriod: TrendPeriod;
  summary: TrendSummary;
  themes: TrendThemeSummary[];
  seriesThemes: TrendSeriesTheme[];
  volume: TrendVolumePoint[];
};