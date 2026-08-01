"use client";

import { useState } from "react";

import { getFeedbackChannelLabel } from "@/lib/feedback-catalog";
import {
  SIMULATED_CHANNEL_OPTIONS,
  type SimulatedChannelKey,
} from "@/lib/simulated-channel-catalog";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { SimulatedChannelImportSummary } from "@/types/simulated-channel";

type SimulatedChannelImportProps = {
  onImported: (summary: SimulatedChannelImportSummary) => void | Promise<void>;
};

export function SimulatedChannelImport({
  onImported,
}: SimulatedChannelImportProps) {
  const [activeSource, setActiveSource] = useState<SimulatedChannelKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SimulatedChannelImportSummary | null>(null);

  async function importSource(source: SimulatedChannelKey) {
    setActiveSource(source);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch("/api/feedback/import/simulated", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source }),
      });

      const result = (await response.json()) as
        | ApiSuccessResponse<{ summary: SimulatedChannelImportSummary }>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setError(
          !result.success
            ? result.error.message
            : "The simulated channel could not be imported.",
        );
        return;
      }

      setSummary(result.data.summary);
      await onImported(result.data.summary);
    } catch {
      setError("The simulated channel is temporarily unavailable. Please try again.");
    } finally {
      setActiveSource(null);
    }
  }

  return (
    <div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        These sources generate local demo records only. LOOP does not contact Zendesk, an app store,
        a survey platform, or a CRM.
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {error}
        </div>
      ) : null}

      {summary ? (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          <p className="font-bold">
            {summary.sourceName} imported {summary.importedRows} records.
          </p>
          <p className="mt-1 leading-6">
            Every record is NEW and queued with a PENDING classification state.
          </p>
        </div>
      ) : null}

      <ul className="mt-6 space-y-4" aria-label="Simulated feedback sources">
        {SIMULATED_CHANNEL_OPTIONS.map((source) => {
          const isImporting = activeSource === source.key;
          const anotherSourceIsImporting = activeSource !== null && !isImporting;

          return (
            <li
              key={source.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-slate-900">{source.name}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {getFeedbackChannelLabel(source.channel)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {source.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span>{source.itemCount} records</span>
                    <span aria-hidden="true">·</span>
                    <span>{source.freshnessLabel}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void importSource(source.key)}
                  disabled={activeSource !== null}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-loop-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isImporting
                    ? "Importing…"
                    : anotherSourceIsImporting
                      ? "Waiting…"
                      : "Pull feedback"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}