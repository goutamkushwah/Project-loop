"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardAnalyticsData } from "@/types/dashboard";

type DashboardAnalyticsProps = {
  data: DashboardAnalyticsData;
};

type StatCardProps = {
  label: string;
  value: string;
  description: string;
};

const SENTIMENT_COLORS = {
  POS: "#059669",
  NEU: "#64748b",
  NEG: "#dc2626",
} as const;

const tooltipStyle = {
  borderRadius: "0.75rem",
  border: "1px solid #e2e8f0",
  boxShadow: "0 18px 45px -28px rgba(15, 23, 42, 0.45)",
  fontSize: "0.8125rem",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
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

function ChartEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="max-w-sm">
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-xl shadow-sm"
        >
          ◌
        </span>
        <h3 className="mt-4 text-base font-black text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

export function DashboardAnalytics({ data }: DashboardAnalyticsProps) {
  const sentimentHasData = data.stats.classifiedItems > 0;
  const themesHaveData = data.topThemes.length > 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard statistics">
        <StatCard
          label="Total feedback"
          value={formatNumber(data.stats.totalItems)}
          description={`Items received in the selected ${data.period.dayCount}-day window.`}
        />
        <StatCard
          label="Negative feedback"
          value={formatPercentage(data.stats.negativePercentage)}
          description={`${formatNumber(data.stats.negativeItems)} of ${formatNumber(data.stats.classifiedItems)} classified items.`}
        />
        <StatCard
          label="New this week"
          value={formatNumber(data.stats.newThisWeek)}
          description="Feedback created since Monday within the active filters."
        />
        <StatCard
          label="Classification coverage"
          value={formatPercentage(data.stats.classificationCoverage)}
          description={`${formatNumber(data.stats.classifiedItems)} of ${formatNumber(data.stats.totalItems)} items contain stored sentiment.`}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Volume</p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Feedback over time</h2>
          </div>
          <p className="text-sm text-slate-500">
            {data.period.dateFrom} to {data.period.dateTo}
          </p>
        </div>

        {data.stats.totalItems > 0 ? (
          <div className="mt-6 h-80" aria-label="Feedback volume chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.volume} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="feedbackVolumeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c6ce7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c6ce7" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
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
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, "Feedback"]} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6554c0"
                  strokeWidth={3}
                  fill="url(#feedbackVolumeFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6">
            <ChartEmptyState
              title="No feedback in this period"
              description="Adjust the date, channel, or workflow filters to include feedback records."
            />
          </div>
        )}

        <ul className="sr-only">
          {data.volume.map((point) => (
            <li key={point.date}>
              {point.date}: {point.count} feedback items
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Sentiment</p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Sentiment breakdown</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Uses stored classification results only; unclassified feedback is excluded.
            </p>
          </div>

          {sentimentHasData ? (
            <div className="mt-5 h-72" aria-label="Sentiment breakdown chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.sentiment}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={64}
                    outerRadius={96}
                    paddingAngle={3}
                  >
                    {data.sentiment.map((point) => (
                      <Cell key={point.sentiment} fill={SENTIMENT_COLORS[point.sentiment]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, name) => [formatNumber(Number(value)), name]}
                  />
                  <Legend verticalAlign="bottom" height={32} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5">
              <ChartEmptyState
                title="No classified sentiment yet"
                description="The chart will populate from stored Claude classification results during the AI sprint."
              />
            </div>
          )}

          <ul className="mt-4 grid grid-cols-3 gap-2" aria-label="Sentiment totals">
            {data.sentiment.map((point) => (
              <li key={point.sentiment} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-xs font-bold text-slate-500">{point.label}</p>
                <p className="mt-1 text-lg font-black text-slate-900">{formatNumber(point.count)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatPercentage(point.percentage)}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Themes</p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Top themes</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Counts tenant-scoped theme assignments on feedback matching the active filters.
            </p>
          </div>

          {themesHaveData ? (
            <div className="mt-5 h-72" aria-label="Top themes chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.topThemes}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 24, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fill: "#475569", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [formatNumber(Number(value)), "Feedback"]}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {data.topThemes.map((theme) => (
                      <Cell key={theme.id} fill={theme.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5">
              <ChartEmptyState
                title="No theme assignments yet"
                description="Top themes will appear after feedback is classified and assigned to workspace themes."
              />
            </div>
          )}

          {themesHaveData ? (
            <ul className="mt-4 space-y-2" aria-label="Top theme totals">
              {data.topThemes.map((theme) => (
                <li key={theme.id} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="truncate">{theme.name}</span>
                  </span>
                  <span className="shrink-0 font-bold text-slate-900">
                    {formatNumber(theme.count)} · {formatPercentage(theme.percentage)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </section>
    </div>
  );
}