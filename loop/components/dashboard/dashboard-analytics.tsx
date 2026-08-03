"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { DashboardAnalytics, DashboardDateRange } from "@/types/dashboard";

const SENTIMENT_COLORS = {
  positive: "#0f9d58",
  neutral: "#a78bfa",
  negative: "#dc2626",
  unclassified: "#94a3b8",
} as const;

function shortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function DashboardAnalyticsPanel() {
  const [range, setRange] = useState<DashboardDateRange>("30d");
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/dashboard/analytics?range=${range}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const result = (await response.json()) as
          | ApiSuccessResponse<DashboardAnalytics>
          | ApiErrorResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !result.success) {
          setError(!result.success ? result.error.message : "Analytics could not be loaded.");
          return;
        }

        setAnalytics(result.data);
      } catch {
        if (!cancelled) {
          setError("Analytics is temporarily unavailable. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const sentimentData = analytics
    ? [
        { name: "Positive", value: analytics.sentimentBreakdown.positive, color: SENTIMENT_COLORS.positive },
        { name: "Neutral", value: analytics.sentimentBreakdown.neutral, color: SENTIMENT_COLORS.neutral },
        { name: "Negative", value: analytics.sentimentBreakdown.negative, color: SENTIMENT_COLORS.negative },
        { name: "Unclassified", value: analytics.sentimentBreakdown.unclassified, color: SENTIMENT_COLORS.unclassified },
      ]
    : [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
            Analytics
          </p>
          <h2 className="mt-2 text-2xl font-black text-loop-900">Feedback overview</h2>
        </div>
        <DashboardFilterBar value={range} onChange={setRange} disabled={isLoading} />
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
          <p className="font-bold text-red-900">Analytics could not be loaded</p>
          <p className="mt-1 text-sm text-red-800">{error}</p>
        </div>
      ) : null}

      {!error && (isLoading || !analytics) ? (
        <div className="mt-6 grid gap-5 md:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {!error && analytics ? (
        <div aria-busy={isLoading} className={isLoading ? "opacity-60" : undefined}>
          {/* Stat cards */}
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total feedback
              </p>
              <p className="mt-2 text-3xl font-black text-loop-900">
                {analytics.stats.totalItems.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                % negative
              </p>
              <p className="mt-2 text-3xl font-black text-loop-900">
                {analytics.stats.negativePercentage}%
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                New this week
              </p>
              <p className="mt-2 text-3xl font-black text-loop-900">
                {analytics.stats.newThisWeek.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Volume over time */}
          <div className="mt-8">
            <p className="text-sm font-bold text-slate-700">Volume over time</p>
            <div className="mt-3 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.volumeOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDate}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    minTickGap={24}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip labelFormatter={(value) => shortDate(String(value))} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6554c0"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {/* Sentiment breakdown */}
            <div>
              <p className="text-sm font-bold text-slate-700">Sentiment breakdown</p>
              <div className="mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sentimentData} layout="vertical" margin={{ left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 12, fill: "#334155" }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {sentimentData.map((entry) => (
                        <Bar key={entry.name} dataKey="value" fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top themes */}
            <div>
              <p className="text-sm font-bold text-slate-700">Top themes</p>
              {analytics.topThemes.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                  No themes have been assigned to feedback in this range yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {analytics.topThemes.map((theme) => (
                    <li
                      key={theme.themeId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: theme.color }}
                        />
                        {theme.name}
                      </span>
                      <span className="rounded-full bg-loop-50 px-2.5 py-1 text-xs font-bold text-loop-800">
                        {theme.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
