import Link from "next/link";

import { getFeedbackChannelLabel } from "@/lib/feedback-catalog";
import {
  getFeedbackSentimentLabel,
  getFeedbackStatusLabel,
} from "@/lib/feedback-filter-catalog";
import type { FeedbackPage, FeedbackSentimentValue } from "@/types/feedback";
import type { ThemeDetail } from "@/types/theme";

type ThemeFeedbackListProps = {
  theme: ThemeDetail;
  page: FeedbackPage;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

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

function buildPageHref(themeId: string, page: FeedbackPage, nextPage: number): string {
  const params = new URLSearchParams();

  if (nextPage > 1) {
    params.set("page", String(nextPage));
  }

  if (page.query.search) {
    params.set("search", page.query.search);
  }

  const query = params.toString();
  return query ? `/themes/${themeId}?${query}` : `/themes/${themeId}`;
}

export function ThemeFeedbackList({ theme, page }: ThemeFeedbackListProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <form method="GET" action={`/themes/${theme.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="theme-feedback-search" className="block text-sm font-bold text-slate-800">
              Search this theme
            </label>
            <input
              id="theme-feedback-search"
              name="search"
              type="search"
              defaultValue={page.query.search}
              maxLength={200}
              placeholder="Search feedback content…"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-loop-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Search
          </button>
          <Link
            href={`/themes/${theme.id}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Clear
          </Link>
        </form>
      </section>

      {page.items.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-xl shadow-sm">
            ⌕
          </span>
          <h2 className="mt-5 text-xl font-black text-slate-900">
            {page.query.search ? "No matching feedback" : "No feedback assigned"}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            {page.query.search
              ? "No feedback in this theme matches the current search."
              : "This theme currently has no underlying feedback assignments."}
          </p>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">
              Showing {(page.pagination.page - 1) * page.pagination.pageSize + 1}–
              {Math.min(
                page.pagination.page * page.pagination.pageSize,
                page.pagination.totalItems,
              )} of {page.pagination.totalItems.toLocaleString()}
            </p>
            <Link
              href={`/inbox?themeId=${encodeURIComponent(theme.id)}`}
              className="text-sm font-bold text-loop-700 underline decoration-loop-300 underline-offset-4 hover:text-loop-900"
            >
              Open this theme in the inbox
            </Link>
          </div>

          <ul className="space-y-4" aria-label={`Feedback assigned to ${theme.name}`}>
            {page.items.map((feedback) => {
              const selectedAssignment = feedback.themes.find((assignment) => assignment.id === theme.id);

              return (
                <li key={feedback.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
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
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 ring-1 ring-inset ring-blue-200">
                      {getFeedbackStatusLabel(feedback.status)}
                    </span>
                    {selectedAssignment ? (
                      <span className="rounded-full bg-loop-50 px-3 py-1 text-xs font-bold text-loop-800 ring-1 ring-inset ring-loop-200">
                        {Math.round(selectedAssignment.confidence * 100)}% theme confidence
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">
                    {feedback.content}
                  </p>

                  <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>{feedback.customerLabel ?? "Unlabelled customer"}</span>
                    <span>{dateFormatter.format(new Date(feedback.createdAt))}</span>
                  </div>

                  {feedback.themes.length > 1 ? (
                    <div className="mt-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Also assigned to
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {feedback.themes
                          .filter((assignment) => assignment.id !== theme.id)
                          .map((assignment) => (
                            <li key={assignment.id}>
                              <Link
                                href={`/themes/${assignment.id}`}
                                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:ring-loop-300 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
                              >
                                <span
                                  aria-hidden="true"
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: assignment.color }}
                                />
                                {assignment.name}
                              </Link>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <nav className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5" aria-label="Theme feedback pagination">
            {page.pagination.page > 1 ? (
              <Link
                href={buildPageHref(theme.id, page, page.pagination.page - 1)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">
                Previous
              </span>
            )}

            <p className="text-sm font-semibold text-slate-600">
              Page {page.pagination.page} of {page.pagination.totalPages}
            </p>

            {page.pagination.page < page.pagination.totalPages ? (
              <Link
                href={buildPageHref(theme.id, page, page.pagination.page + 1)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">
                Next
              </span>
            )}
          </nav>
        </>
      )}
    </div>
  );
}