"use client";

import { getFeedbackChannelLabel } from "@/lib/feedback-catalog";
import {
  getFeedbackSentimentLabel,
  getFeedbackStatusLabel,
} from "@/lib/feedback-filter-catalog";
import type {
  FeedbackPage,
  FeedbackSentimentValue,
  FeedbackStatusValue,
} from "@/types/feedback";

type FeedbackListProps = {
  page: FeedbackPage;
  canUpdate: boolean;
  isLoading: boolean;
  updatingFeedbackId: string | null;
  error: string | null;
  onPageChange: (page: number) => void;
  onStatusChange: (feedbackId: string, status: "REVIEWED" | "ACTIONED") => void;
  onRetry: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function classificationLabel(status: FeedbackPage["items"][number]["classificationStatus"]) {
  switch (status) {
    case "PENDING":
      return "Queued";
    case "PROCESSING":
      return "Processing";
    case "COMPLETED":
      return "Classified";
    case "FAILED":
      return "Failed";
    case "REVIEW_REQUIRED":
      return "Review required";
  }
}

function classificationClassName(
  status: FeedbackPage["items"][number]["classificationStatus"],
): string {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "FAILED":
      return "bg-red-50 text-red-800 ring-red-200";
    case "REVIEW_REQUIRED":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "PROCESSING":
      return "bg-blue-50 text-blue-800 ring-blue-200";
    case "PENDING":
      return "bg-violet-50 text-violet-800 ring-violet-200";
  }
}

function workflowClassName(status: FeedbackStatusValue): string {
  switch (status) {
    case "NEW":
      return "bg-blue-50 text-blue-800 ring-blue-200";
    case "REVIEWED":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "ACTIONED":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
}

function sentimentClassName(sentiment: FeedbackSentimentValue): string {
  switch (sentiment) {
    case "POS":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "NEU":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "NEG":
      return "bg-red-50 text-red-800 ring-red-200";
  }
}

function nextWorkflowAction(status: FeedbackStatusValue): {
  target: "REVIEWED" | "ACTIONED";
  label: string;
} | null {
  switch (status) {
    case "NEW":
      return {
        target: "REVIEWED",
        label: "Mark reviewed",
      };
    case "REVIEWED":
      return {
        target: "ACTIONED",
        label: "Mark actioned",
      };
    case "ACTIONED":
      return null;
  }
}

function hasActiveCriteria(page: FeedbackPage): boolean {
  const query = page.query;

  return Boolean(
    query.search ||
      query.channel ||
      query.sentiment ||
      query.themeId ||
      query.status ||
      query.dateFrom ||
      query.dateTo,
  );
}

export function FeedbackList({
  page,
  canUpdate,
  isLoading,
  updatingFeedbackId,
  error,
  onPageChange,
  onStatusChange,
  onRetry,
}: FeedbackListProps) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6" role="alert">
        <p className="font-bold text-red-900">Feedback could not be loaded</p>
        <p className="mt-2 text-sm leading-6 text-red-800">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-red-900 px-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (page.items.length === 0) {
    const hasCriteria = hasActiveCriteria(page);

    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-xl shadow-sm"
        >
          {hasCriteria ? "⌕" : "✦"}
        </span>
        <h3 className="mt-5 text-lg font-black text-slate-900">
          {hasCriteria ? "No matching feedback" : "No feedback yet"}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          {hasCriteria
            ? "No feedback matches the active search and filter combination. Clear or broaden one criterion and try again."
            : "Add the first customer comment to begin building the workspace feedback record."}
        </p>
      </div>
    );
  }

  const rangeStart = (page.pagination.page - 1) * page.pagination.pageSize + 1;
  const rangeEnd = Math.min(
    page.pagination.page * page.pagination.pageSize,
    page.pagination.totalItems,
  );

  return (
    <div aria-busy={isLoading} className={isLoading ? "opacity-60" : undefined}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">
          Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
          {page.pagination.totalItems.toLocaleString()}
        </p>
        <p className="text-xs text-slate-500">
          {page.query.sortOrder === "desc" ? "Newest" : "Oldest"} items first
        </p>
      </div>

      <ul className="space-y-4" aria-label="Workspace feedback">
        {page.items.map((feedback) => {
          const nextAction = nextWorkflowAction(feedback.status);
          const isUpdating = updatingFeedbackId === feedback.id;

          return (
            <li
              key={feedback.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {getFeedbackChannelLabel(feedback.channel)}
                    </span>
                    {feedback.sentiment ? (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${sentimentClassName(
                          feedback.sentiment,
                        )}`}
                      >
                        {getFeedbackSentimentLabel(feedback.sentiment)}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${classificationClassName(
                        feedback.classificationStatus,
                      )}`}
                    >
                      {classificationLabel(feedback.classificationStatus)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${workflowClassName(
                        feedback.status,
                      )}`}
                    >
                      {getFeedbackStatusLabel(feedback.status)}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
                    {feedback.content}
                  </p>

                  {feedback.themes.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Assigned feedback themes">
                      {feedback.themes.map((theme) => (
                        <li
                          key={theme.id}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
                          title={`${Math.round(theme.confidence * 100)}% confidence`}
                        >
                          <span
                            aria-hidden="true"
                            className="size-2 rounded-full"
                            style={{ backgroundColor: theme.color }}
                          />
                          {theme.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <time
                  dateTime={feedback.createdAt}
                  className="shrink-0 text-xs font-medium text-slate-500"
                >
                  {dateFormatter.format(new Date(feedback.createdAt))}
                </time>
              </div>

              {feedback.customerLabel || feedback.sourceRef ? (
                <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                  {feedback.customerLabel ? (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Customer
                      </dt>
                      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
                        {feedback.customerLabel}
                      </dd>
                    </div>
                  ) : null}
                  {feedback.sourceRef ? (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Source reference
                      </dt>
                      <dd className="mt-1 break-all text-sm font-semibold text-slate-800">
                        {feedback.sourceRef}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  Workflow: New → Reviewed → Actioned
                </p>

                {canUpdate && nextAction ? (
                  <button
                    type="button"
                    onClick={() => onStatusChange(feedback.id, nextAction.target)}
                    disabled={isLoading || isUpdating || updatingFeedbackId !== null}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUpdating ? "Updating…" : nextAction.label}
                  </button>
                ) : feedback.status === "ACTIONED" ? (
                  <span className="text-xs font-bold text-emerald-700">Workflow complete</span>
                ) : (
                  <span className="text-xs font-medium text-slate-500">Read-only status</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <nav
        className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5"
        aria-label="Feedback pagination"
      >
        <button
          type="button"
          onClick={() => onPageChange(page.pagination.page - 1)}
          disabled={isLoading || page.pagination.page <= 1}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <p className="text-sm font-semibold text-slate-600">
          Page {page.pagination.page} of {page.pagination.totalPages}
        </p>

        <button
          type="button"
          onClick={() => onPageChange(page.pagination.page + 1)}
          disabled={isLoading || page.pagination.page >= page.pagination.totalPages}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </nav>
    </div>
  );
}