"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardTrendsData } from "@/types/dashboard";

type DashboardTrendsProps = {
  data: DashboardTrendsData;
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

// Merge each theme's per-day points into one array keyed by date, so a
// single LineChart can plot every theme as its own line.
function buildChartRows(data: DashboardTrendsData) {
  const dateOrder: string[] = data.themeSeries[0]?.points.map((point) => point.date) ?? [];

  return dateOrder.map((date, index) => {
    const row: Record<string, string | number> = {
      date,
      label: data.themeSeries[0]?.points[index]?.label ?? date,
    };

    for (const series of data.themeSeries) {
      row[series.name] = series.points[index]?.count ?? 0;
    }

    return row;
  });
}

export function DashboardTrends({ data }: DashboardTrendsProps) {
  const hasThemes = data.themeSeries.length > 0;
  const chartRows = hasThemes ? buildChartRows(data) : [];

  return (
    <>
      {/* Card 1: Trend chart */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">
            Trends
          </p>
          <h2 className="text-xl font-black text-loop-900">Theme trend chart</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Daily volume for the workspace&apos;s top {data.themeSeries.length || 0} themes over the
            selected period.
          </p>
        </div>

        {!hasThemes ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-600">
              No themed feedback in this period yet.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Trend lines appear once feedback has been classified into themes.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    minTickGap={20}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  {data.themeSeries.map((series) => (
                    <Line
                      key={series.id}
                      type="monotone"
                      dataKey={series.name}
                      stroke={series.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {data.themeSeries.map((series) => (
                <span
                  key={series.id}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700"
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: series.color }}
                  />
                  {series.name}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Card 2: Spike alerts */}
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">
          Spike detection
        </p>
        <h3 className="mt-1 text-xl font-black text-loop-900">Spike alerts</h3>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
          Any day that jumps well above a theme&apos;s own recent average is flagged as a spike.
        </p>

        {data.spikes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No unusual spikes detected in this period — theme volume has stayed close to its recent
            average.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.spikes.map((spike) => (
              <li
                key={`${spike.themeId}-${spike.date}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: spike.color }}
                  />
                  <p className="text-sm font-bold text-amber-900">{spike.themeName}</p>
                  <span className="text-xs font-medium text-amber-700">on {spike.label}</span>
                </div>
                <p className="text-sm font-semibold text-amber-800">
                  {formatNumber(spike.count)} items — {spike.percentageIncrease.toFixed(0)}% above its
                  ~{spike.baselineAverage} average
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}