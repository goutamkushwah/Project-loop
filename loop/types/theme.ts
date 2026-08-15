import type { FeedbackPage, FeedbackQueryState } from "@/types/feedback";
import type { FeedbackClassificationBatchSummary } from "@/types/feedback-classification";

export type ThemeSortBy = "count" | "name" | "createdAt";
export type ThemeSortOrder = "asc" | "desc";

export type ThemeQueryState = {
  search: string;
  sortBy: ThemeSortBy;
  sortOrder: ThemeSortOrder;
};

export type ThemeListItem = {
  id: string;
  name: string;
  description: string;
  color: string;
  feedbackCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ThemePage = {
  items: ThemeListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  query: ThemeQueryState;
};

export type ThemeDetail = ThemeListItem;

export type ThemeFeedbackPage = {
  theme: ThemeDetail;
  feedback: FeedbackPage;
};

export type ThemeFeedbackQueryState = Omit<FeedbackQueryState, "themeId">;

export type ThemeClusterSummary = FeedbackClassificationBatchSummary & {
  candidateRows: number;
  remainingUnassignedRows: number;
  themeCount: number;
};