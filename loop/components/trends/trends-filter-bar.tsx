import Link from "next/link";

import { FEEDBACK_CHANNELS } from "@/lib/feedback-catalog";
import { FEEDBACK_STATUSES } from "@/lib/feedback-filter-catalog";
import type { TrendQueryState } from "@/types/trend";

type TrendsFilterBarProps = {
  query: TrendQueryState;
};

export function TrendsFilterBar({ query }: TrendsFilterBarProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <form method="GET" action="/trends" className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_220px_200px_auto]">
        <div>
          <label htmlFor="trend-date-from" className="block text-sm font-bold text-slate-800">
            Current period starts
          </label>
          <input
            id="trend-date-from"
            name="dateFrom"
            type="date"
            defaultValue={query.dateFrom}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
          />
        </div>

        <div>
          <label htmlFor="trend-date-to" className="block text-sm font-bold text-slate-800">
            Current period ends
          </label>
          <input
            id="trend-date-to"
            name="dateTo"
            type="date"
            defaultValue={query.dateTo}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
          />
        </div>

        <div>
          <label htmlFor="trend-channel" className="block text-sm font-bold text-slate-800">
            Channel
          </label>
          <select
            id="trend-channel"
            name="channel"
            defaultValue={query.channel ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
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
          <label htmlFor="trend-status" className="block text-sm font-bold text-slate-800">
            Workflow status
          </label>
          <select
            id="trend-status"
            name="status"
            defaultValue={query.status ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
          >
            <option value="">All statuses</option>
            {FEEDBACK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-xl bg-loop-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Apply
          </button>
          <Link
            href="/trends"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Reset
          </Link>
        </div>
      </form>
    </section>
  );
}