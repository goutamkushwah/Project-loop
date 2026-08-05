"use client";

import { type FormEvent, useState } from "react";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type {
  ClassificationPreviewResult,
  ClassificationThemeContext,
} from "@/types/ai";

type ClassificationLabProps = {
  themes: ClassificationThemeContext[];
  configured: boolean;
};

const SAMPLE_FEEDBACK =
  "Onboarding took forever because I could not understand how to invite the rest of my team.";

function sentimentLabel(sentiment: ClassificationPreviewResult["classification"]["sentiment"]): string {
  switch (sentiment) {
    case "POS":
      return "Positive";
    case "NEU":
      return "Neutral";
    case "NEG":
      return "Negative";
  }
}

function sentimentClass(
  sentiment: ClassificationPreviewResult["classification"]["sentiment"],
): string {
  switch (sentiment) {
    case "POS":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "NEU":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "NEG":
      return "bg-red-50 text-red-800 ring-red-200";
  }
}

export function ClassificationLab({ themes, configured }: ClassificationLabProps) {
  const [content, setContent] = useState(SAMPLE_FEEDBACK);
  const [result, setResult] = useState<ClassificationPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ai/classify/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      const payload = (await response.json()) as
        | ApiSuccessResponse<ClassificationPreviewResult>
        | ApiErrorResponse;

      if (!response.ok || !payload.success) {
        setError(
          payload.success
            ? "Classification failed. Please try again."
            : payload.error.message,
        );
        return;
      }

      setResult(payload.data);
    } catch {
      setError("Classification is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">
              Classification request
            </p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Test structured output</h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
              configured
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-amber-50 text-amber-900 ring-amber-200"
            }`}
          >
            {configured ? "Claude configured" : "API key required"}
          </span>
        </div>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="classification-content" className="text-sm font-bold text-slate-800">
                Feedback content
              </label>
              <span className="text-xs text-slate-500">{content.length.toLocaleString()} / 10,000</span>
            </div>
            <textarea
              id="classification-content"
              name="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              minLength={3}
              maxLength={10_000}
              required
              disabled={isSubmitting}
              rows={10}
              className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Paste one customer-feedback item…"
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!configured || isSubmitting || content.trim().length < 3}
            className="inline-flex w-full items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Classifying with Claude…" : "Classify feedback"}
          </button>
        </form>

        <div className="mt-7 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm font-bold text-slate-900">Workspace theme context</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Claude receives {themes.length} existing theme{themes.length === 1 ? "" : "s"} so it can
            reuse established names instead of creating unnecessary duplicates.
          </p>
          <div className="mt-4 flex max-h-32 flex-wrap gap-2 overflow-y-auto" aria-label="Existing themes">
            {themes.length > 0 ? (
              themes.map((theme) => (
                <span
                  key={theme.name}
                  title={theme.description}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
                >
                  {theme.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No workspace themes exist yet.</span>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-live="polite">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">
          Validated response
        </p>
        <h2 className="mt-2 text-2xl font-black text-loop-900">Classification preview</h2>

        {isSubmitting ? (
          <div className="mt-7 space-y-4" aria-label="Classification loading">
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-36 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : result ? (
          <div className="mt-7 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sentiment</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ring-1 ring-inset ${sentimentClass(
                      result.classification.sentiment,
                    )}`}
                  >
                    {sentimentLabel(result.classification.sentiment)}
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {result.classification.sentimentScore.toFixed(2)}
                  </span>
                </div>
              </article>
              <article className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Feature area</p>
                <p className="mt-3 text-base font-black text-slate-900">
                  {result.classification.featureArea}
                </p>
              </article>
            </div>

            <article>
              <p className="text-sm font-bold text-slate-900">Themes</p>
              <div className="mt-3 space-y-3">
                {result.classification.themes.map((theme) => (
                  <div key={theme.name} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-slate-900">{theme.name}</span>
                      <span className="text-sm font-bold text-loop-700">
                        {(theme.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-loop-600"
                        style={{ width: `${Math.round(theme.confidence * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl bg-loop-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-loop-700">Rationale</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {result.classification.rationale}
              </p>
            </article>

            <dl className="grid gap-3 border-t border-slate-200 pt-5 text-xs sm:grid-cols-2">
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-500">Model</dt>
                <dd className="mt-1 break-words font-semibold text-slate-800">{result.metadata.model}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-500">Attempts</dt>
                <dd className="mt-1 font-semibold text-slate-800">{result.metadata.attempts}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-500">Token usage</dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {result.metadata.inputTokens} input · {result.metadata.outputTokens} output
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-wide text-slate-500">Latency</dt>
                <dd className="mt-1 font-semibold text-slate-800">
                  {result.metadata.latencyMs.toLocaleString()} ms
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="mt-7 grid min-h-[28rem] place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="max-w-sm">
              <span
                aria-hidden="true"
                className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm"
              >
                ✦
              </span>
              <h3 className="mt-5 text-lg font-black text-slate-900">No classification yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Submit one feedback item to verify Claude connectivity, strict JSON parsing, Zod
                validation, and one automatic repair attempt.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}