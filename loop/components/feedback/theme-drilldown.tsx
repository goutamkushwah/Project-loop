"use client";

import { useEffect, useState } from "react";

type FeedbackItem = {
  id: string;
  content: string;
  sentiment: "POS" | "NEU" | "NEG" | null;
  sentimentScore: number | null;
  featureArea: string | null;
  classificationRationale: string | null;
  classificationStatus: string;
  channel: string;
  status: string;
  createdAt: string;
  confidence: number;
};

type Theme = {
  id: string;
  name: string;
  description: string;
  color: string;
};

type ThemeDrilldownProps = {
  themeId: string;
  onBack: () => void;
};

function sentimentLabel(
  sentiment: FeedbackItem["sentiment"],
) {
  if (sentiment === "POS") return "Positive";
  if (sentiment === "NEG") return "Negative";
  if (sentiment === "NEU") return "Neutral";

  return "Unknown";
}

export function ThemeDrilldown({
  themeId,
  onBack,
}: ThemeDrilldownProps) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTheme() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/feedback/themes/${themeId}?drillDown=true`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load theme");
        }

        const data = await response.json();

        setTheme(data.theme);
        setFeedback(data.feedback ?? []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load theme",
        );
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, [themeId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm text-slate-700">
        Loading theme...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!theme) {
    return null;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Back to themes
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: theme.color }}
          />

          <h2 className="text-2xl font-bold text-slate-900">
            {theme.name}
          </h2>
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {theme.description}
        </p>

        <div className="mt-4 text-sm font-medium text-slate-700">
          {feedback.length} feedback item
          {feedback.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="space-y-4">
        {feedback.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No feedback found for this theme.
          </div>
        ) : (
          feedback.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {sentimentLabel(item.sentiment)}
                </span>

                {item.featureArea && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                    {item.featureArea}
                  </span>
                )}

                <span className="ml-auto text-xs text-slate-400">
                  Confidence:{" "}
                  {(item.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-700">
                {item.content}
              </p>

              {item.classificationRationale && (
                <p className="mt-3 text-xs text-slate-500">
                  {item.classificationRationale}
                </p>
              )}

              <div className="mt-4 text-xs text-slate-400">
                {new Date(
                  item.createdAt,
                ).toLocaleString()}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}