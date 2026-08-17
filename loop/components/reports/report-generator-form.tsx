"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { VoiceOfCustomerReportDetail } from "@/types/report";

type ReportGeneratorFormProps = {
  defaultRange: {
    dateFrom: string;
    dateTo: string;
  };
};

export function ReportGeneratorForm({ defaultRange }: ReportGeneratorFormProps) {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState(defaultRange.dateFrom);
  const [dateTo, setDateTo] = useState(defaultRange.dateTo);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo, title }),
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<{ report: VoiceOfCustomerReportDetail }>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setError(!result.success ? result.error.message : "The report could not be generated.");
        return;
      }

      router.push(`/reports/${result.data.report.id}`);
      router.refresh();
    } catch {
      setError("The report service is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-loop-200 bg-white p-5 shadow-sm sm:p-7"
      noValidate
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mt-2 text-2xl font-black text-loop-900">New Voice-of-Customer report</h2>
          
        </div>
        <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
          Gemini · server-side
        </span>
      </div>

      {error ? (
        <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1.6fr_auto] lg:items-end">
        <div>
          <label htmlFor="report-date-from" className="block text-sm font-bold text-slate-700">From</label>
          <input
            id="report-date-from"
            type="date"
            required
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:bg-slate-100"
          />
        </div>
        <div>
          <label htmlFor="report-date-to" className="block text-sm font-bold text-slate-700">To</label>
          <input
            id="report-date-to"
            type="date"
            required
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            disabled={isSubmitting}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:bg-slate-100"
          />
        </div>
        <div>
          <label htmlFor="report-title" className="block text-sm font-bold text-slate-700">
            Title <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="report-title"
            type="text"
            maxLength={180}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={isSubmitting}
            placeholder="Weekly Voice of Customer"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:bg-slate-100"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-loop-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Generating…" : "Generate report"}
        </button>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        The selected period can cover up to 366 days. Empty periods are rejected instead of producing generic filler.
      </p>
    </form>
  );
}