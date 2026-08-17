"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FeedbackCsvUpload } from "@/components/feedback/feedback-csv-upload";
import { FeedbackEntryForm } from "@/components/feedback/feedback-entry-form";
import { FeedbackInboxToolbar } from "@/components/feedback/feedback-inbox-toolbar";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { SimulatedChannelImport } from "@/components/feedback/simulated-channel-import";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type {
  FeedbackListItem,
  FeedbackPage,
  FeedbackQueryState,
  FeedbackStatusUpdateResult,
  FeedbackThemeOption,
} from "@/types/feedback";
import type { FeedbackClassificationRunResult } from "@/types/feedback-classification";
import type { FeedbackCsvImportSummary } from "@/types/feedback-import";
import type { SimulatedChannelImportSummary } from "@/types/simulated-channel";

type FeedbackWorkspaceProps = {
  initialPage: FeedbackPage;
  themeOptions: FeedbackThemeOption[];
  canCreate: boolean;
  canUpdate: boolean;
};

type IngestionMode = "single" | "csv" | "channel";

const PAGE_SIZE = 10;

function emptyFeedbackQuery(): FeedbackQueryState {
  return {
    search: "",
    channel: null,
    sentiment: null,
    themeId: null,
    status: null,
    dateFrom: null,
    dateTo: null,
    sortOrder: "desc",
  };
}

function normalizeFeedbackQuery(query: FeedbackQueryState): FeedbackQueryState {
  return {
    ...query,
    search: query.search.trim().replace(/\s+/g, " "),
  };
}

function buildFeedbackQueryString(page: number, query: FeedbackQueryState): URLSearchParams {
  const searchParams = new URLSearchParams({
    page: String(Math.max(1, page)),
    pageSize: String(PAGE_SIZE),
    sortOrder: query.sortOrder,
  });

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.channel) {
    searchParams.set("channel", query.channel);
  }

  if (query.sentiment) {
    searchParams.set("sentiment", query.sentiment);
  }

  if (query.themeId) {
    searchParams.set("themeId", query.themeId);
  }

  if (query.status) {
    searchParams.set("status", query.status);
  }

  if (query.dateFrom) {
    searchParams.set("dateFrom", query.dateFrom);
  }

  if (query.dateTo) {
    searchParams.set("dateTo", query.dateTo);
  }

  return searchParams;
}

function updateInboxUrl(page: number, query: FeedbackQueryState): void {
  const url = new URL(window.location.href);
  const searchParams = buildFeedbackQueryString(page, query);

  searchParams.delete("pageSize");
  searchParams.delete("sortOrder");

  if (page <= 1) {
    searchParams.delete("page");
  }

  url.search = searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function classificationNotice(status: FeedbackListItem["classificationStatus"]): string {
  switch (status) {
    case "COMPLETED":
      return "classified successfully";
    case "REVIEW_REQUIRED":
      return "saved but requires manual classification review";
    case "FAILED":
      return "saved but automatic classification failed";
    case "PROCESSING":
      return "saved and is being classified";
    case "PENDING":
      return "saved and queued for classification";
  }
}

function mergeThemeOptions(
  current: FeedbackThemeOption[],
  feedbackItems: readonly FeedbackListItem[],
): FeedbackThemeOption[] {
  const byId = new Map(current.map((theme) => [theme.id, theme]));

  feedbackItems.forEach((feedback) => {
    feedback.themes.forEach((theme) => {
      byId.set(theme.id, {
        id: theme.id,
        name: theme.name,
        color: theme.color,
      });
    });
  });

  return Array.from(byId.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function FeedbackWorkspace({
  initialPage,
  themeOptions,
  canCreate,
  canUpdate,
}: FeedbackWorkspaceProps) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [availableThemeOptions, setAvailableThemeOptions] = useState(themeOptions);
  const [draftQuery, setDraftQuery] = useState<FeedbackQueryState>(initialPage.query);
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);
  const [classifyingFeedbackId, setClassifyingFeedbackId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setAvailableThemeOptions(themeOptions);
  }, [themeOptions]);

  async function loadPage(nextPage: number, requestedQuery = page.query) {
    const safePage = Math.max(1, nextPage);
    const normalizedQuery = normalizeFeedbackQuery(requestedQuery);
    const queryString = buildFeedbackQueryString(safePage, normalizedQuery);

    setIsLoading(true);
    setLoadError(null);
    setActionError(null);

    try {
      const response = await fetch(`/api/feedback?${queryString.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const result = (await response.json()) as
        | ApiSuccessResponse<FeedbackPage>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setLoadError(
          !result.success ? result.error.message : "Feedback could not be loaded.",
        );
        return;
      }

      setPage(result.data);
      setDraftQuery(result.data.query);
      setAvailableThemeOptions((current) => mergeThemeOptions(current, result.data.items));
      updateInboxUrl(result.data.pagination.page, result.data.query);
    } catch {
      setLoadError("Feedback is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function resetInboxAfterIngestion() {
    const clearedQuery = emptyFeedbackQuery();
    setDraftQuery(clearedQuery);
    await loadPage(1, clearedQuery);
  }

  async function handleCreated(feedback: FeedbackListItem) {
    setAvailableThemeOptions((current) => mergeThemeOptions(current, [feedback]));
    setNotice(
      `Feedback from ${feedback.customerLabel ?? "the selected channel"} was ${classificationNotice(
        feedback.classificationStatus,
      )}.`,
    );
    await resetInboxAfterIngestion();
  }

  async function handleImported(summary: FeedbackCsvImportSummary) {
    setNotice(
      `${summary.importedRows.toLocaleString()} CSV row${
        summary.importedRows === 1 ? " was" : "s were"
      } imported: ${summary.classification.completedRows.toLocaleString()} classified, ${summary.classification.reviewRequiredRows.toLocaleString()} require review, and ${summary.classification.failedRows.toLocaleString()} failed classification.`,
    );
    await resetInboxAfterIngestion();
    router.refresh();
  }

  async function handleSimulatedImport(summary: SimulatedChannelImportSummary) {
    setNotice(
      `${summary.sourceName} added ${summary.importedRows.toLocaleString()} records: ${summary.classification.completedRows.toLocaleString()} classified, ${summary.classification.reviewRequiredRows.toLocaleString()} require review, and ${summary.classification.failedRows.toLocaleString()} failed classification.`,
    );
    await resetInboxAfterIngestion();
    router.refresh();
  }

  async function handleStatusChange(
    feedbackId: string,
    status: "REVIEWED" | "ACTIONED",
  ) {
    setUpdatingFeedbackId(feedbackId);
    setActionError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}/status`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = (await response.json()) as
        | ApiSuccessResponse<FeedbackStatusUpdateResult>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setActionError(
          !result.success
            ? result.error.message
            : "The feedback status could not be updated.",
        );
        return;
      }

      setNotice(
        result.data.changed
          ? `Feedback moved from ${result.data.previousStatus} to ${result.data.feedback.status}.`
          : `Feedback is already ${result.data.feedback.status}.`,
      );

      if (result.data.changed) {
        await loadPage(page.pagination.page, page.query);
      } else {
        setPage((currentPage) => ({
          ...currentPage,
          items: currentPage.items.map((item) =>
            item.id === result.data.feedback.id ? result.data.feedback : item,
          ),
        }));
      }
    } catch {
      setActionError("The feedback status is temporarily unavailable. Please try again.");
    } finally {
      setUpdatingFeedbackId(null);
    }
  }

  async function handleClassification(feedbackId: string) {
    setClassifyingFeedbackId(feedbackId);
    setActionError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/feedback/${feedbackId}/classify`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<{
            classification: FeedbackClassificationRunResult;
            feedback: FeedbackListItem;
          }>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setActionError(
          !result.success
            ? result.error.message
            : "Feedback classification could not be completed.",
        );
        return;
      }

      setAvailableThemeOptions((current) => mergeThemeOptions(current, [result.data.feedback]));
      setPage((currentPage) => ({
        ...currentPage,
        items: currentPage.items.map((item) =>
          item.id === result.data.feedback.id ? result.data.feedback : item,
        ),
      }));

      switch (result.data.classification.status) {
        case "COMPLETED":
          setNotice("Feedback was re-classified successfully with Gemini.");
          break;
        case "REVIEW_REQUIRED":
          setNotice("Gemini returned invalid structured output twice. Manual review is required.");
          break;
        case "FAILED":
          setActionError(
            result.data.classification.message ??
              "Automatic classification failed. You can retry when Gemini is available.",
          );
          break;
      }
    } catch {
      setActionError("Feedback classification is temporarily unavailable. Please try again.");
    } finally {
      setClassifyingFeedbackId(null);
    }
  }

  const ingestionHeading =
    ingestionMode === "single"
      ? "Add customer feedback"
      : ingestionMode === "csv"
        ? "Import a CSV file"
        : "Pull from a simulated channel";

  const ingestionDescription =
    ingestionMode === "single"
      ? "Record one customer comment with its source channel. LOOP classifies it immediately after the database insert."
      : ingestionMode === "csv"
        ? "Validate, import, and classify up to 2,000 customer-feedback rows in one server-side operation."
        : "Choose a local demo source to seed realistic records and classify them without calling a real third-party platform.";

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
              Feedback ingestion
            </p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">{ingestionHeading}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{ingestionDescription}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 rounded-xl bg-slate-100 p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={ingestionMode === "single"}
            onClick={() => {
              setNotice(null);
              setIngestionMode("single");
            }}
            className={`rounded-lg px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 sm:px-3 sm:text-sm ${
              ingestionMode === "single"
                ? "bg-white text-loop-900 shadow-sm"
                : "text-slate-600 hover:text-loop-900"
            }`}
          >
            Single entry
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ingestionMode === "csv"}
            onClick={() => {
              setNotice(null);
              setIngestionMode("csv");
            }}
            className={`rounded-lg px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 sm:px-3 sm:text-sm ${
              ingestionMode === "csv"
                ? "bg-white text-loop-900 shadow-sm"
                : "text-slate-600 hover:text-loop-900"
            }`}
          >
            CSV upload
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ingestionMode === "channel"}
            onClick={() => {
              setNotice(null);
              setIngestionMode("channel");
            }}
            className={`rounded-lg px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 sm:px-3 sm:text-sm ${
              ingestionMode === "channel"
                ? "bg-white text-loop-900 shadow-sm"
                : "text-slate-600 hover:text-loop-900"
            }`}
          >
            Demo channel
          </button>
        </div>

        <div className="mt-7">
          {canCreate ? (
            ingestionMode === "single" ? (
              <FeedbackEntryForm onCreated={handleCreated} />
            ) : ingestionMode === "csv" ? (
              <FeedbackCsvUpload onImported={handleImported} />
            ) : (
              <SimulatedChannelImport onImported={handleSimulatedImport} />
            )
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-bold text-slate-900">Read-only workspace access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Viewers can read, search, and filter workspace feedback but cannot create entries,
                upload CSV files, pull simulated records, re-classify feedback, or change workflow
                status. Every mutation API enforces this restriction with HTTP 403.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
              Feedback inbox
            </p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Search, filter, and triage</h2>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">
             classification active
          </span>
        </div>

        <FeedbackInboxToolbar
          queryValue={draftQuery}
          activeQuery={page.query}
          themeOptions={availableThemeOptions}
          totalItems={page.pagination.totalItems}
          isLoading={isLoading}
          onQueryChange={setDraftQuery}
          onApply={(query) => {
            setNotice(null);
            void loadPage(1, query);
          }}
          onClear={() => {
            const clearedQuery = emptyFeedbackQuery();
            setDraftQuery(clearedQuery);
            setNotice(null);
            void loadPage(1, clearedQuery);
          }}
        />

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {notice}
          </div>
        ) : null}

        {actionError ? (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {actionError}
          </div>
        ) : null}

        <FeedbackList
          page={page}
          canUpdate={canUpdate}
          isLoading={isLoading}
          updatingFeedbackId={updatingFeedbackId}
          classifyingFeedbackId={classifyingFeedbackId}
          error={loadError}
          onPageChange={(nextPage) => {
            setNotice(null);
            void loadPage(nextPage, page.query);
          }}
          onStatusChange={(feedbackId, status) => {
            void handleStatusChange(feedbackId, status);
          }}
          onClassify={(feedbackId) => {
            void handleClassification(feedbackId);
          }}
          onRetry={() => void loadPage(page.pagination.page, page.query)}
        />
      </section>
    </div>
  );
}