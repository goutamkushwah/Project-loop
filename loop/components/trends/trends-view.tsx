"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendAnalyticsData, TrendThemeSummary } from "@/types/trend";

type TrendsViewProps = {
  data: TrendAnalyticsData;
};

type StatCardProps = {
  label: string;
  value: string;
  description: string;
};

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e2e8f0",
  boxShadow: "0 18px 45px -28px rgba(15, 23, 42, 0.45)",
  fontSize: "0.8125rem",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-loop-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}

function changeLabel(theme: TrendThemeSummary): string {
  if (theme.previousCount === 0 && theme.currentCount > 0) {
    return "New in current period";
  }

  if (theme.percentageChange === null) {
    return "No prior baseline";
  }

  if (theme.percentageChange > 0) {
    return `+${theme.percentageChange}%`;
  }

  return `${theme.percentageChange}%`;
}

function changeClassName(theme: TrendThemeSummary): string {
  if (theme.isSpiking) {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }

  if (theme.absoluteChange > 0) {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (theme.absoluteChange < 0) {
    return "bg-blue-50 text-blue-800 ring-blue-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function buildEvidenceHref(theme: TrendThemeSummary, data: TrendAnalyticsData): string {
  const params = new URLSearchParams({
    themeId: theme.id,
    dateFrom: data.currentPeriod.dateFrom,
    dateTo: data.currentPeriod.dateTo,
  });

  if (data.query.channel) {
    params.set("channel", data.query.channel);
  }

  if (data.query.status) {
    params.set("status", data.query.status);
  }

  return `/inbox?${params.toString()}`;
}

export function TrendsView({ data }: TrendsViewProps) {
  const spikingThemes = data.themes.filter((theme) => theme.isSpiking);
  const comparisonChartData = data.themes.slice(0, 8).map((theme) => ({
    name: theme.name,
    current: theme.currentCount,
    previous: theme.previousCount,
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Theme trend statistics">
        <StatCard
          label="Active themes"
          value={formatNumber(data.summary.activeThemes)}
          description="Themes with at least one assignment in the selected current period."
        />
        <StatCard
          label="Spiking themes"
          value={formatNumber(data.summary.spikingThemes)}
          description="Themes crossing LOOP's evidence-aware growth threshold versus the prior equal period."
        />
        <StatCard
          label="Current assignments"
          value={formatNumber(data.summary.currentAssignments)}
          description={`${data.currentPeriod.dateFrom} to ${data.currentPeriod.dateTo}.`}
        />
        <StatCard
          label="Previous assignments"
          value={formatNumber(data.summary.previousAssignments)}
          description={`${data.previousPeriod.dateFrom} to ${data.previousPeriod.dateTo}.`}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>

            <h2 className="mt-2 text-2xl font-black text-loop-900">Theme activity over time</h2>
            
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            {data.currentPeriod.dayCount} days
          </span>
        </div>

        {data.seriesThemes.length > 0 ? (
          <>
            <div className="mt-6 h-96" aria-label="Theme volume over time chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.volume} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" height={42} />
                  {data.seriesThemes.map((theme) => (
                    <Line
                      key={theme.id}
                      type="monotone"
                      dataKey={theme.seriesKey}
                      name={theme.name}
                      stroke={theme.color}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <ul className="sr-only">
              {data.volume.map((point) => (
                <li key={point.date}>
                  {point.date}: {data.seriesThemes.map((theme) => `${theme.name} ${String(point[theme.seriesKey] ?? 0)}`).join(", ")}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <h3 className="text-lg font-black text-slate-900">No theme activity in this period</h3>
           
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
           
            <h2 className="mt-2 text-2xl font-black text-loop-900">Current vs previous period</h2>
            
          </div>

          {comparisonChartData.length > 0 ? (
            <div className="mt-6 h-80" aria-label="Theme current versus previous period chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} layout="vertical" margin={{ top: 4, right: 12, left: 38, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#475569", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="previous" name="Previous period" fill="#cbd5e1" radius={[0, 7, 7, 0]} />
                  <Bar dataKey="current" name="Current period" fill="#6554c0" radius={[0, 7, 7, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
              No theme assignments exist in either comparison period.
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            
            <h2 className="mt-2 text-2xl font-black text-loop-900">Themes needing attention</h2>
           
          </div>

          {spikingThemes.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {spikingThemes.map((theme) => (
                <li key={theme.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: theme.color }} />
                        <Link href={`/themes/${theme.id}`} className="truncate font-black text-amber-950 hover:underline">
                          {theme.name}
                        </Link>
                      </div>
                      <p className="mt-2 text-sm text-amber-900">
                        {theme.previousCount.toLocaleString()} → {theme.currentCount.toLocaleString()} assignments · {changeLabel(theme)}
                      </p>
                    </div>
                    <Link
                      href={buildEvidenceHref(theme, data)}
                      className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-inset ring-amber-300 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                    >
                      Evidence
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <h3 className="font-black text-slate-900">No themes are spiking</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                No theme currently crosses LOOP's spike threshold for this comparison window.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            
            <h2 className="mt-2 text-2xl font-black text-loop-900">All active comparison themes</h2>
          </div>
          <p className="text-sm text-slate-500">Click evidence to inspect the exact feedback behind a trend.</p>
        </div>

        {data.themes.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <caption className="sr-only">Theme assignment counts for the current and previous comparison periods.</caption>
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="border-b border-slate-200 px-3 py-3">Theme</th>
                  <th scope="col" className="border-b border-slate-200 px-3 py-3 text-right">Current</th>
                  <th scope="col" className="border-b border-slate-200 px-3 py-3 text-right">Previous</th>
                  <th scope="col" className="border-b border-slate-200 px-3 py-3 text-right">Change</th>
                  <th scope="col" className="border-b border-slate-200 px-3 py-3 text-right">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {data.themes.map((theme) => (
                  <tr key={theme.id}>
                    <th scope="row" className="border-b border-slate-100 px-3 py-4 font-normal">
                      <Link href={`/themes/${theme.id}`} className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-loop-700">
                        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: theme.color }} />
                        {theme.name}
                      </Link>
                    </th>
                    <td className="border-b border-slate-100 px-3 py-4 text-right font-bold text-slate-900">
                      {formatNumber(theme.currentCount)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 text-right text-slate-600">
                      {formatNumber(theme.previousCount)}
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${changeClassName(theme)}`}>
                        {theme.isSpiking ? "Spike · " : ""}{changeLabel(theme)}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-4 text-right">
                      <Link
                        href={buildEvidenceHref(theme, data)}
                        className="font-bold text-loop-700 underline decoration-loop-300 underline-offset-4 hover:text-loop-900"
                      >
                        View feedback
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
            There are no theme assignments in the current or previous comparison period.
          </div>
        )}
      </section>
    </div>
  );
}