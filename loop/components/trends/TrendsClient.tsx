"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Range = "weekly" | "monthly";

type TrendMovement = { theme: string; change: number; count: number };

type TrendsResponse = {
  range: Range;
  chartData: Record<string, number | string>[];
  themes: string[];
  spikes: TrendMovement[];
  drops: TrendMovement[];
  insight: string;
};

const LINE_COLORS = [
  "#6366F1", "#F97316", "#10B981", "#EC4899", "#0EA5E9", "#EAB308", "#8B5CF6",
];

function formatBucketLabel(iso: string, range: Range) {
  const d = new Date(iso);
  return range === "monthly"
    ? d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TrendsClient() {
  const [range, setRange] = useState<Range>("weekly");
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/trends?range=${range}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return (await res.json()) as TrendsResponse;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Failed to load trends");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.chartData.map((row) => ({
      ...row,
      label: formatBucketLabel(row.bucket as string, range),
    }));
  }, [data, range]);

  return (
    <div className="space-y-6">
      {/* Header + Weekly / Monthly toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Theme Trends</h1>
          <p className="text-sm text-slate-500">
            Theme volume over time, with spikes flagged against the previous period.
          </p>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {(["weekly", "monthly"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                range === r
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {r === "weekly" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex h-72 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <span className="text-sm text-slate-400">Loading trends…</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Couldn&apos;t load trends: {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && data && data.chartData.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            No feedback yet for this period. Once feedback comes in and gets classified,
            theme trends will show up here.
          </p>
        </div>
      )}

      {/* Loaded state */}
      {!loading && !error && data && data.chartData.length > 0 && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-700">
              <span className="mr-1.5 inline-block rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600">
                AI insight
              </span>
              {data.insight}
            </p>
          </div>

          <div className="h-96 rounded-xl border border-slate-200 bg-white p-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {data.themes.map((theme, i) => (
                  <Line
                    key={theme}
                    type="monotone"
                    dataKey={theme}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">📈 Spiking themes</h2>
              {data.spikes.length === 0 ? (
                <p className="text-sm text-slate-400">Nothing spiking this period.</p>
              ) : (
                <ul className="space-y-2">
                  {data.spikes.map((s) => (
                    <li
                      key={s.theme}
                      className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{s.theme}</span>
                      <span className="font-semibold text-orange-600">
                        +{s.change}% · {s.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">📉 Cooling themes</h2>
              {data.drops.length === 0 ? (
                <p className="text-sm text-slate-400">Nothing cooling off this period.</p>
              ) : (
                <ul className="space-y-2">
                  {data.drops.map((d) => (
                    <li
                      key={d.theme}
                      className="flex items-center justify-between rounded-lg bg-sky-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{d.theme}</span>
                      <span className="font-semibold text-sky-600">
                        {d.change}% · {d.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}