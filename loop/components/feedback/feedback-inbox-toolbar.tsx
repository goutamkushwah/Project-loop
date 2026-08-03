"use client";

import type { FormEvent } from "react";

import {
  FEEDBACK_CHANNELS,
  getFeedbackChannelLabel,
} from "@/lib/feedback-catalog";
import {
  FEEDBACK_SENTIMENTS,
  FEEDBACK_STATUSES,
  getFeedbackSentimentLabel,
  getFeedbackStatusLabel,
} from "@/lib/feedback-filter-catalog";
import type {
  FeedbackQueryState,
  FeedbackThemeOption,
} from "@/types/feedback";

const MAX_SEARCH_LENGTH = 200;

type FeedbackInboxToolbarProps = {
  queryValue: FeedbackQueryState;
  activeQuery: FeedbackQueryState;
  themeOptions: FeedbackThemeOption[];
  totalItems: number;
  isLoading: boolean;
  onQueryChange: (query: FeedbackQueryState) => void;
  onApply: (query: FeedbackQueryState) => void;
  onClear: () => void;
};

function hasCriteria(query: FeedbackQueryState): boolean {
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

function countCriteria(query: FeedbackQueryState): number {
  return [
    query.search,
    query.channel,
    query.sentiment,
    query.themeId,
    query.status,
    query.dateFrom || query.dateTo,
  ].filter(Boolean).length;
}

export function FeedbackInboxToolbar({
  queryValue,
  activeQuery,
  themeOptions,
  totalItems,
  isLoading,
  onQueryChange,
  onApply,
  onClear,
}: FeedbackInboxToolbarProps) {
  const dateRangeInvalid = Boolean(
    queryValue.dateFrom && queryValue.dateTo && queryValue.dateFrom > queryValue.dateTo,
  );
  const activeCriteriaCount = countCriteria(activeQuery);
  const activeTheme = themeOptions.find((theme) => theme.id === activeQuery.themeId);
  const activeLabels = [
    activeQuery.search ? `Search: “${activeQuery.search}”` : null,
    activeQuery.channel ? `Channel: ${getFeedbackChannelLabel(activeQuery.channel)}` : null,
    activeQuery.sentiment
      ? `Sentiment: ${getFeedbackSentimentLabel(activeQuery.sentiment)}`
      : null,
    activeQuery.themeId ? `Theme: ${activeTheme?.name ?? "Unavailable"}` : null,
    activeQuery.status ? `Status: ${getFeedbackStatusLabel(activeQuery.status)}` : null,
    activeQuery.dateFrom ? `From: ${activeQuery.dateFrom}` : null,
    activeQuery.dateTo ? `To: ${activeQuery.dateTo}` : null,
  ].filter((label): label is string => Boolean(label));

  function updateQuery(patch: Partial<FeedbackQueryState>) {
    onQueryChange({
      ...queryValue,
      ...patch,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (dateRangeInvalid) {
      return;
    }

    onApply({
      ...queryValue,
      search: queryValue.search.trim().replace(/\s+/g, " "),
    });
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <form onSubmit={handleSubmit} role="search" className="space-y-5">
        <div>
          <label htmlFor="feedback-search" className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Search feedback content
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400"
              >
                ⌕
              </span>
              <input
                id="feedback-search"
                name="search"
                type="search"
                value={queryValue.search}
                onChange={(event) => updateQuery({ search: event.target.value })}
                maxLength={MAX_SEARCH_LENGTH}
                disabled={isLoading}
                placeholder="Search the words customers used…"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || dateRangeInvalid}
              className="rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Applying…" : "Apply filters"}
            </button>

            {hasCriteria(queryValue) || hasCriteria(activeQuery) ? (
              <button
                type="button"
                onClick={onClear}
                disabled={isLoading}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear all
              </button>
            ) : null}
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wide text-slate-600">
            Refine results
          </legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="feedback-channel-filter" className="block text-xs font-semibold text-slate-700">
                Channel
              </label>
              <select
                id="feedback-channel-filter"
                value={queryValue.channel ?? ""}
                onChange={(event) =>
                  updateQuery({
                    channel: (event.target.value || null) as FeedbackQueryState["channel"],
                  })
                }
                disabled={isLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">All channels</option>
                {FEEDBACK_CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-sentiment-filter" className="block text-xs font-semibold text-slate-700">
                Sentiment
              </label>
              <select
                id="feedback-sentiment-filter"
                value={queryValue.sentiment ?? ""}
                onChange={(event) =>
                  updateQuery({
                    sentiment: (event.target.value || null) as FeedbackQueryState["sentiment"],
                  })
                }
                disabled={isLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">All sentiments</option>
                {FEEDBACK_SENTIMENTS.map((sentiment) => (
                  <option key={sentiment.value} value={sentiment.value}>
                    {sentiment.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-theme-filter" className="block text-xs font-semibold text-slate-700">
                Theme
              </label>
              <select
                id="feedback-theme-filter"
                value={queryValue.themeId ?? ""}
                onChange={(event) => updateQuery({ themeId: event.target.value || null })}
                disabled={isLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">All themes</option>
                {themeOptions.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-status-filter" className="block text-xs font-semibold text-slate-700">
                Workflow status
              </label>
              <select
                id="feedback-status-filter"
                value={queryValue.status ?? ""}
                onChange={(event) =>
                  updateQuery({
                    status: (event.target.value || null) as FeedbackQueryState["status"],
                  })
                }
                disabled={isLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">All statuses</option>
                {FEEDBACK_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="feedback-date-from" className="block text-xs font-semibold text-slate-700">
                Date from
              </label>
              <input
                id="feedback-date-from"
                type="date"
                value={queryValue.dateFrom ?? ""}
                onChange={(event) => updateQuery({ dateFrom: event.target.value || null })}
                disabled={isLoading}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div>
              <label htmlFor="feedback-date-to" className="block text-xs font-semibold text-slate-700">
                Date to
              </label>
              <input
                id="feedback-date-to"
                type="date"
                value={queryValue.dateTo ?? ""}
                onChange={(event) => updateQuery({ dateTo: event.target.value || null })}
                disabled={isLoading}
                aria-invalid={dateRangeInvalid}
                aria-describedby={dateRangeInvalid ? "feedback-date-error" : undefined}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              {dateRangeInvalid ? (
                <p id="feedback-date-error" className="mt-2 text-xs font-semibold text-red-700">
                  End date must be on or after the start date.
                </p>
              ) : null}
            </div>
          </div>
        </fieldset>
      </form>

      <div className="mt-5 border-t border-slate-200 pt-4">
        <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Search and every filter run server-side inside the active workspace.</p>
          <p aria-live="polite">
            {totalItems.toLocaleString()} matching item{totalItems === 1 ? "" : "s"}
            {activeCriteriaCount > 0
              ? ` · ${activeCriteriaCount} active ${activeCriteriaCount === 1 ? "criterion" : "criteria"}`
              : ""}
          </p>
        </div>

        {activeLabels.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active feedback filters">
            {activeLabels.map((label) => (
              <li
                key={label}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
              >
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}