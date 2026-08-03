"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Shape returned by GET /api/insights/sentiment (or computed client-side
// from the feedback list already loaded on the dashboard).
export interface SentimentDatum {
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    count: number;
}

interface SentimentChartProps {
    data: SentimentDatum[];
    isLoading?: boolean;
}

// Fixed colors so POSITIVE/NEUTRAL/NEGATIVE always render the same color,
// regardless of array order coming back from the API.
const COLORS: Record<SentimentDatum["sentiment"], string> = {
    POSITIVE: "#22c55e", // green-500
    NEUTRAL: "#eab308", // yellow-500
    NEGATIVE: "#ef4444", // red-500
};

const LABELS: Record<SentimentDatum["sentiment"], string> = {
    POSITIVE: "Positive",
    NEUTRAL: "Neutral",
    NEGATIVE: "Negative",
};

export default function SentimentChart({ data, isLoading }: SentimentChartProps) {
    if (isLoading) {
        return <SentimentChartSkeleton />;
    }

    const total = data.reduce((sum, d) => sum + d.count, 0);

    if (total === 0) {
        return (
            <div className="flex h-72 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
                <p className="text-sm font-medium text-gray-500">No feedback yet</p>
                <p className="text-xs text-gray-400">
                    Sentiment breakdown will appear once feedback is ingested.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Sentiment breakdown</h3>
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="count"
                        nameKey="sentiment"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.sentiment} fill={COLORS[entry.sentiment]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number, name: string) => [
                            `${value} (${((value / total) * 100).toFixed(0)}%)`,
                            LABELS[name as SentimentDatum["sentiment"]] ?? name,
                        ]}
                    />
                    <Legend
                        formatter={(value: string) => LABELS[value as SentimentDatum["sentiment"]] ?? value}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export function SentimentChartSkeleton() {
    return (
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-4 h-4 w-40 rounded bg-gray-200" />
            <div className="mx-auto h-52 w-52 rounded-full bg-gray-100" />
        </div>
    );
}