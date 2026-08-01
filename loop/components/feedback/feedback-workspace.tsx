"use client";

import { useState } from "react";

import { FeedbackCsvUpload } from "@/components/feedback/feedback-csv-upload";
import { FeedbackEntryForm } from "@/components/feedback/feedback-entry-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { SimulatedChannelImport } from "@/components/feedback/simulated-channel-import";
import FeedbackSearch from "@/components/feedback/FeedbackSearch";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { FeedbackListItem, FeedbackPage } from "@/types/feedback";
import type { FeedbackCsvImportSummary } from "@/types/feedback-import";
import type { SimulatedChannelImportSummary } from "@/types/simulated-channel";


type FeedbackWorkspaceProps = {
  initialPage: FeedbackPage;
  canCreate: boolean;
};

type IngestionMode = "single" | "csv" | "channel";

const PAGE_SIZE = 10;

export function FeedbackWorkspace({ initialPage, canCreate }: FeedbackWorkspaceProps) {
  const [page, setPage] = useState(initialPage);
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>("single");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPage(nextPage: number) {
    const safePage = Math.max(1, nextPage);
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/feedback?page=${safePage}&pageSize=${PAGE_SIZE}&sortOrder=desc`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

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
    } catch {
      setLoadError("Feedback is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreated(feedback: FeedbackListItem) {
    setNotice(`Feedback from ${feedback.customerLabel ?? "the selected channel"} was saved.`);
    await loadPage(1);
  }

  async function handleImported(summary: FeedbackCsvImportSummary) {
    setNotice(
      `${summary.importedRows.toLocaleString()} CSV row${summary.importedRows === 1 ? " was" : "s were"
      } imported and queued for classification.`,
    );
    await loadPage(1);
  }

  async function handleSimulatedImport(summary: SimulatedChannelImportSummary) {
    setNotice(
      `${summary.sourceName} added ${summary.importedRows.toLocaleString()} realistic records to this workspace.`,
    );
    await loadPage(1);
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
    <div className="space-y-8">
      {/* ---------- Search bar: searches the whole workspace, shows history ---------- */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
          Search feedback
        </p>
        <div className="mt-4">
          <FeedbackSearch />
        </div>
      </section>

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
              className={`rounded-lg px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 sm:px-3 sm:text-sm ${ingestionMode === "single"
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
              className={`rounded-lg px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 sm:px-3 sm:text-sm ${ingestionMode === "csv"
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
              className={`rounded-lg px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 sm:px-3 sm:text-sm ${ingestionMode === "channel"
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
                  Viewers can read workspace feedback but cannot create manual entries, upload CSV
                  files, or pull simulated channel records. Every ingestion API enforces this
                  restriction with HTTP 403.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
                Workspace record
              </p>
              <h2 className="mt-2 text-2xl font-black text-loop-900">Recent feedback</h2>
            </div>
            <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 ring-1 ring-inset ring-violet-200">
              AI classification pending
            </span>
          </div>

          {notice ? (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              {notice}
            </div>
          ) : null}

          <FeedbackList
            page={page}
            isLoading={isLoading}
            error={loadError}
            onPageChange={(nextPage) => {
              setNotice(null);
              void loadPage(nextPage);
            }}
            onRetry={() => void loadPage(page.pagination.page)}
          />
        </section>
      </div>
    </div>
  );
}