import Link from "next/link";

import { FEEDBACK_CHANNELS } from "@/lib/feedback-catalog";
import { FEEDBACK_STATUSES } from "@/lib/feedback-filter-catalog";
import type { DashboardQueryState } from "@/types/dashboard";

type DashboardFilterBarProps = {
  query: DashboardQueryState;
};

export function DashboardFilterBar({ query }: DashboardFilterBarProps) {
  return (
    <section
      aria-labelledby="dashboard-filter-heading"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
            Analytics controls
          </p>
          <h2 id="dashboard-filter-heading" className="mt-2 text-xl font-black text-loop-900">
            Filter the active reporting window
          </h2>
        </div>
        <p className="text-sm text-slate-500">All charts and stat cards use the same filters.</p>
      </div>

      <form action="/dashboard" method="get" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div>
          <label htmlFor="dashboard-date-from" className="block text-sm font-bold text-slate-800">
            From
          </label>
          <input
            id="dashboard-date-from"
            name="dateFrom"
            type="date"
            required
            defaultValue={query.dateFrom}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
          />
        </div>

        <div>
          <label htmlFor="dashboard-date-to" className="block text-sm font-bold text-slate-800">
            To
          </label>
          <input
            id="dashboard-date-to"
            name="dateTo"
            type="date"
            required
            defaultValue={query.dateTo}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
          />
        </div>

        <div>
          <label htmlFor="dashboard-channel" className="block text-sm font-bold text-slate-800">
            Channel
          </label>
          <select
            id="dashboard-channel"
            name="channel"
            defaultValue={query.channel ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
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
          <label htmlFor="dashboard-status" className="block text-sm font-bold text-slate-800">
            Workflow status
          </label>
          <select
            id="dashboard-status"
            name="status"
            defaultValue={query.status ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
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
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-loop-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Apply filters
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Reset
          </Link>
        </div>
      </form>
    </section>
  );
}