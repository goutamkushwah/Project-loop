"use client";

import type { FormEvent } from "react";

const MAX_SEARCH_LENGTH = 200;

type FeedbackInboxToolbarProps = {
  searchValue: string;
  activeSearch: string;
  totalItems: number;
  isLoading: boolean;
  onSearchValueChange: (value: string) => void;
  onSubmit: (search: string) => void;
  onClear: () => void;
};

export function FeedbackInboxToolbar({
  searchValue,
  activeSearch,
  totalItems,
  isLoading,
  onSearchValueChange,
  onSubmit,
  onClear,
}: FeedbackInboxToolbarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(searchValue.trim().replace(/\s+/g, " "));
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <form onSubmit={handleSubmit} role="search" className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor="feedback-search" className="sr-only">
            Search feedback content
          </label>
          <div className="relative">
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
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              maxLength={MAX_SEARCH_LENGTH}
              disabled={isLoading}
              placeholder="Search the words customers used…"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || searchValue.trim().length === 0}
          className="rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Searching…" : "Search"}
        </button>

        {activeSearch ? (
          <button
            type="button"
            onClick={onClear}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        ) : null}
      </form>

      <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Search runs on the server against feedback content.</p>
        {activeSearch ? (
          <p aria-live="polite">
            {totalItems.toLocaleString()} result{totalItems === 1 ? "" : "s"} for “{activeSearch}”
          </p>
        ) : null}
      </div>
    </div>
  );
}