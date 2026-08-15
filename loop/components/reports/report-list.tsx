import Link from "next/link";

import type { ReportPage } from "@/types/report";

type ReportListProps = {
  page: ReportPage;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

function pageHref(page: ReportPage, targetPage: number): string {
  const params = new URLSearchParams();
  params.set("page", String(targetPage));
  params.set("pageSize", String(page.query.pageSize));
  if (page.query.search) params.set("search", page.query.search);
  if (page.query.periodFrom) params.set("periodFrom", page.query.periodFrom);
  if (page.query.periodTo) params.set("periodTo", page.query.periodTo);
  params.set("sortBy", page.query.sortBy);
  params.set("sortOrder", page.query.sortOrder);
  return `/reports?${params.toString()}`;
}

export function ReportList({ page }: ReportListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Saved reports</p>
          <h2 className="mt-2 text-2xl font-black text-loop-900">Voice-of-Customer history</h2>
          <p className="mt-2 text-sm text-slate-600">
            {page.pagination.totalItems.toLocaleString()} saved report{page.pagination.totalItems === 1 ? "" : "s"} in this workspace.
          </p>
        </div>
      </div>

      <form action="/reports" method="get" className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] xl:items-end">
        <div>
          <label htmlFor="report-search" className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Search</label>
          <input id="report-search" name="search" defaultValue={page.query.search} placeholder="Report title" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100" />
        </div>
        <div>
          <label htmlFor="period-from" className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Period from</label>
          <input id="period-from" name="periodFrom" type="date" defaultValue={page.query.periodFrom ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100" />
        </div>
        <div>
          <label htmlFor="period-to" className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Period to</label>
          <input id="period-to" name="periodTo" type="date" defaultValue={page.query.periodTo ?? ""} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100" />
        </div>
        <div>
          <label htmlFor="report-sort" className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Sort by</label>
          <select id="report-sort" name="sortBy" defaultValue={page.query.sortBy} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100">
            <option value="createdAt">Generated</option>
            <option value="periodStart">Period</option>
            <option value="title">Title</option>
          </select>
        </div>
        <div>
          <label htmlFor="report-order" className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Order</label>
          <select id="report-order" name="sortOrder" defaultValue={page.query.sortOrder} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        <div className="flex gap-2">
          <input type="hidden" name="pageSize" value={page.query.pageSize} />
          <button type="submit" className="rounded-xl bg-loop-900 px-4 py-2 text-sm font-bold text-white hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">Apply</button>
          <Link href="/reports" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">Clear</Link>
        </div>
      </form>

      {page.items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <h3 className="text-lg font-black text-slate-900">No saved reports match this view</h3>
          <p className="mt-2 text-sm text-slate-600">Generate a report above or clear the current report filters.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200">
          {page.items.map((report) => (
            <article key={report.id} className="flex flex-col gap-4 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-slate-900">{report.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{formatDate(report.periodStart)} – {formatDate(report.periodEnd)}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Generated {formatDateTime(report.createdAt)}{report.generatedBy ? ` by ${report.generatedBy.name}` : ""}
                </p>
              </div>
              <Link href={`/reports/${report.id}`} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-loop-200 bg-loop-50 px-4 py-2 text-sm font-bold text-loop-800 transition hover:bg-loop-100 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">View report</Link>
            </article>
          ))}
        </div>
      )}

      <nav className="mt-6 flex items-center justify-between gap-4" aria-label="Saved report pagination">
        <p className="text-sm text-slate-500">Page {page.pagination.page} of {page.pagination.totalPages}</p>
        <div className="flex gap-2">
          {page.pagination.page > 1 ? (
            <Link href={pageHref(page, page.pagination.page - 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">Previous</Link>
          ) : (
            <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">Previous</span>
          )}
          {page.pagination.page < page.pagination.totalPages ? (
            <Link href={pageHref(page, page.pagination.page + 1)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">Next</Link>
          ) : (
            <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">Next</span>
          )}
        </div>
      </nav>
    </section>
  );
}