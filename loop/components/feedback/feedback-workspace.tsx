"use client";

import { useState } from "react";

import { FeedbackCsvUpload } from "@/components/feedback/feedback-csv-upload";
import { FeedbackEntryForm } from "@/components/feedback/feedback-entry-form";
import { FeedbackInboxToolbar } from "@/components/feedback/feedback-inbox-toolbar";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { SimulatedChannelImport } from "@/components/feedback/simulated-channel-import";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type {
  FeedbackListItem,
  FeedbackPage,
  FeedbackStatusUpdateResult,
} from "@/types/feedback";
import type { FeedbackCsvImportSummary } from "@/types/feedback-import";
import type { SimulatedChannelImportSummary } from "@/types/simulated-channel";

type FeedbackWorkspaceProps = {
  initialPage: FeedbackPage;
  canCreate: boolean;
  canUpdate: boolean;
};

type IngestionMode = "single" | "csv" | "channel";

const PAGE_SIZE = 10;

function updateInboxUrl(page: number, search: string): void {
  const url = new URL(window.location.href);

  if (page > 1) {
    url.searchParams.set("page", String(page));
  } else {
    url.searchParams.delete("page");
  }

  if (search) {
    url.searchParams.set("search", search);
  } else {
    url.searchParams.delete("search");
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function FeedbackWorkspace({
  initialPage,
  canCreate,
  canUpdate,
}: FeedbackWorkspaceProps) {
  const [page, setPage] = useState(initialPage);
  const [searchValue, setSearchValue] = useState(initialPage.query.search);
  const [activeSearch, setActiveSearch] = useState(initialPage.query.search);
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPage(nextPage: number, search = activeSearch) {
    const safePage = Math.max(1, nextPage);
    const normalizedSearch = search.trim().replace(/\s+/g, " ");
    const query = new URLSearchParams({
      page: String(safePage),
      pageSize: String(PAGE_SIZE),
      sortOrder: "desc",
    });

    if (normalizedSearch) {
      query.set("search", normalizedSearch);
    }

    setIsLoading(true);
    setLoadError(null);
    setActionError(null);

    try {
      const response = await fetch(`/api/feedback?${query.toString()}`, {
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
      setActiveSearch(result.data.query.search);
      updateInboxUrl(result.data.pagination.page, result.data.query.search);
    } catch {
      setLoadError("Feedback is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function resetInboxAfterIngestion() {
    setSearchValue("");
    setActiveSearch("");
    await loadPage(1, "");
  }

  async function handleCreated(feedback: FeedbackListItem) {
    setNotice(`Feedback from ${feedback.customerLabel ?? "the selected channel"} was saved.`);
    await resetInboxAfterIngestion();
  }

  async function handleImported(summary: FeedbackCsvImportSummary) {
    setNotice(
      `${summary.importedRows.toLocaleString()} CSV row${
        summary.importedRows === 1 ? " was" : "s were"
      } imported and queued for classification.`,
    );
    await resetInboxAfterIngestion();
  }

  async function handleSimulatedImport(summary: SimulatedChannelImportSummary) {
    setNotice(
      `${summary.sourceName} added ${summary.importedRows.toLocaleString()} realistic records to this workspace.`,
    );
    await resetInboxAfterIngestion();
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

      setPage((currentPage) => ({
        ...currentPage,
        items: currentPage.items.map((item) =>
          item.id === result.data.feedback.id ? result.data.feedback : item,
        ),
      }));

      setNotice(
        result.data.changed
          ? `Feedback moved from ${result.data.previousStatus} to ${result.data.feedback.status}.`
          : `Feedback is already ${result.data.feedback.status}.`,
      );
    } catch {
      setActionError("The feedback status is temporarily unavailable. Please try again.");
    } finally {
      setUpdatingFeedbackId(null);
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
      ? "Record one customer comment with its source channel. Content and channel are required."
      : ingestionMode === "csv"
        ? "Validate and import up to 2,000 customer-feedback rows in one server-side operation."
        : "Choose a local demo source to seed realistic records without calling a real third-party platform.";

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
                Viewers can read and search workspace feedback but cannot create entries, upload CSV
                files, pull simulated records, or change workflow status. Every mutation API enforces
                this restriction with HTTP 403.
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
            <h2 className="mt-2 text-2xl font-black text-loop-900">Search and triage</h2>
          </div>
          <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 ring-1 ring-inset ring-violet-200">
            Server-side results
          </span>
        </div>

        <FeedbackInboxToolbar
          searchValue={searchValue}
          activeSearch={activeSearch}
          totalItems={page.pagination.totalItems}
          isLoading={isLoading}
          onSearchValueChange={setSearchValue}
          onSubmit={(search) => {
            setNotice(null);
            void loadPage(1, search);
          }}
          onClear={() => {
            setSearchValue("");
            setNotice(null);
            void loadPage(1, "");
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
          error={loadError}
          onPageChange={(nextPage) => {
            setNotice(null);
            void loadPage(nextPage);
          }}
          onStatusChange={(feedbackId, status) => {
            void handleStatusChange(feedbackId, status);
          }}
          onRetry={() => void loadPage(page.pagination.page)}
        />
      </section>
    </div>
  );
}