"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { useRouter } from "next/navigation";

// Shape returned by GET /api/themes?withCounts=true
export interface ThemeDatum {
    id: string;
    name: string;
    count: number;
    color?: string | null;
    // Optional: percentage change vs previous period, used to flag spikes (AI2).
    trendPct?: number;
}

interface ThemeChartProps {
    data: ThemeDatum[];
    isLoading?: boolean;
    /** How many themes to show, sorted by count descending. Default 8. */
    limit?: number;
}

const FALLBACK_COLOR = "#6366f1"; // indigo-500
const SPIKE_COLOR = "#f97316"; // orange-500, for themes trending up sharply

export default function ThemeChart({ data, isLoading, limit = 8 }: ThemeChartProps) {
    const router = useRouter();

    if (isLoading) {
        return <ThemeChartSkeleton />;
    }

    if (data.length === 0) {
        return (
            <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-500">No themes yet</p>
                <p className="text-xs text-gray-400">
                    Themes are created automatically as feedback is classified.
                </p>
            </div>
        );
    }

    const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, limit);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Top themes</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sorted} layout="vertical" margin={{ left: 24, right: 16 }}>
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        formatter={(value: number, _name, item) => {
                            const trend = (item?.payload as ThemeDatum)?.trendPct;
                            const trendLabel =
                                trend !== undefined ? ` (${trend > 0 ? "+" : ""}${trend}% vs last period)` : "";
                            return [`${value} items${trendLabel}`, "Volume"];
                        }}
                    />
                    <Bar
                        dataKey="count"
                        radius={[0, 4, 4, 0]}
                        // Clicking a bar drills into that theme's feedback (C5 acceptance
                        // criteria #4: "clicking a theme drills into underlying items").
                        onClick={(entry: unknown) => {
                            const theme = entry as ThemeDatum;
                            if (theme?.id) router.push(`/trends/${theme.id}`);
                        }}
                        className="cursor-pointer"
                    >
                        {sorted.map((entry) => (
                            <Cell
                                key={entry.id}
                                fill={
                                    entry.trendPct && entry.trendPct >= 20
                                        ? SPIKE_COLOR
                                        : entry.color ?? FALLBACK_COLOR
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ThemeChartSkeleton() {
    return (
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-4 h-4 w-32 rounded bg-gray-200" />
            <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-6 rounded bg-gray-100"
                        style={{ width: `${90 - i * 10}%` }}
                    />
                ))}
            </div>
        </div>
    );
}