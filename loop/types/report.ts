import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { FeedbackSentimentValue } from "@/types/feedback";

export type ReportSortBy = "createdAt" | "periodStart" | "title";
export type ReportSortOrder = "asc" | "desc";

export type ReportListQueryState = {
  page: number;
  pageSize: number;
  search: string;
  periodFrom: string | null;
  periodTo: string | null;
  sortBy: ReportSortBy;
  sortOrder: ReportSortOrder;
};

export type ReportListItem = {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  generatedBy: {
    name: string;
    email: string;
  } | null;
};

export type ReportPage = {
  items: ReportListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  query: ReportListQueryState;
};

export type ReportPeriodSnapshot = {
  dateFrom: string;
  dateTo: string;
  dayCount: number;
  previousDateFrom: string;
  previousDateTo: string;
};

export type ReportSentimentMetric = {
  sentiment: FeedbackSentimentValue;
  label: string;
  count: number;
  percentage: number;
  previousCount: number;
  previousPercentage: number;
  deltaPercentagePoints: number;
};

export type ReportThemeMetric = {
  id: string;
  name: string;
  color: string;
  count: number;
  percentage: number;
};

export type ReportEvidenceItem = {
  feedbackId: string;
  content: string;
  channel: FeedbackChannelValue;
  customerLabel: string | null;
  sentiment: FeedbackSentimentValue | null;
  sentimentScore: number | null;
  featureArea: string | null;
  createdAt: string;
  themes: {
    id: string;
    name: string;
    confidence: number;
  }[];
};

export type ReportThemeInsight = {
  themeId: string;
  insight: string;
};

export type ReportRecommendedAction = {
  title: string;
  rationale: string;
  relatedThemeIds: string[];
  evidenceFeedbackIds: string[];
};

export type ReportNarrative = {
  headline: string;
  executiveSummary: string;
  sentimentSummary: string;
  themeInsights: ReportThemeInsight[];
  notableQuoteIds: string[];
  recommendedActions: ReportRecommendedAction[];
};

export type VoiceOfCustomerReportContent = {
  schemaVersion: "1";
  generatedAt: string;
  provider: "GOOGLE_GEMINI";
  model: string;
  period: ReportPeriodSnapshot;
  stats: {
    totalFeedback: number;
    previousTotalFeedback: number;
    classifiedFeedback: number;
    previousClassifiedFeedback: number;
    classificationCoverage: number;
    previousClassificationCoverage: number;
  };
  sentiment: ReportSentimentMetric[];
  topThemes: ReportThemeMetric[];
  evidence: ReportEvidenceItem[];
  narrative: ReportNarrative;
};

export type ReportSharingState = {
  enabled: boolean;
  createdAt: string | null;
};

export type VoiceOfCustomerReportDetail = ReportListItem & {
  updatedAt: string;
  sharing: ReportSharingState;
  content: VoiceOfCustomerReportContent;
};

export type SharedVoiceOfCustomerReportDetail = {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
  content: VoiceOfCustomerReportContent;
};

export type ReportShareCreated = {
  reportId: string;
  shareUrl: string;
  createdAt: string;
};