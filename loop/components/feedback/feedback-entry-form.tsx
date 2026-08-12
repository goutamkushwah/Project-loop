"use client";

import { type FormEvent, useState } from "react";

import {
  FEEDBACK_CHANNELS,
  type FeedbackChannelValue,
} from "@/lib/feedback-catalog";
import type { ApiErrorResponse, ApiFieldErrors, ApiSuccessResponse } from "@/types/api";
import type { FeedbackListItem } from "@/types/feedback";

type FeedbackEntryFormProps = {
  onCreated: (feedback: FeedbackListItem) => Promise<void> | void;
};

type CreateFeedbackResponse = {
  feedback: FeedbackListItem;
};

const MAX_CONTENT_LENGTH = 10_000;

export function FeedbackEntryForm({ onCreated }: FeedbackEntryFormProps) {
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<FeedbackChannelValue | "">("");
  const [customerLabel, setCustomerLabel] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});

  function firstError(field: string): string | undefined {
    return fieldErrors[field]?.[0];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          channel,
          customerLabel,
          sourceRef,
        }),
      });

      const result = (await response.json()) as
        | ApiSuccessResponse<CreateFeedbackResponse>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        if (!result.success && result.error.fieldErrors) {
          setFieldErrors(result.error.fieldErrors);
        }

        setFormError(
          !result.success ? result.error.message : "Feedback could not be saved.",
        );
        return;
      }

      setContent("");
      setChannel("");
      setCustomerLabel("");
      setSourceRef("");
      await onCreated(result.data.feedback);
    } catch {
      setFormError("Feedback is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {formError}
        </div>
      ) : null}

      <div>
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="feedback-content" className="block text-sm font-bold text-slate-800">
            Feedback content
          </label>
          <span className="text-xs text-slate-500" aria-live="polite">
            {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
          </span>
        </div>
        <textarea
          id="feedback-content"
          name="content"
          required
          minLength={3}
          maxLength={MAX_CONTENT_LENGTH}
          rows={8}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          disabled={isSubmitting}
          aria-invalid={Boolean(firstError("content"))}
          aria-describedby={firstError("content") ? "feedback-content-error" : undefined}
          className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Describe exactly what the customer said or experienced."
        />
        {firstError("content") ? (
          <p id="feedback-content-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("content")}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="feedback-channel" className="block text-sm font-bold text-slate-800">
          Channel
        </label>
        <select
          id="feedback-channel"
          name="channel"
          required
          value={channel}
          onChange={(event) => setChannel(event.target.value as FeedbackChannelValue | "")}
          disabled={isSubmitting}
          aria-invalid={Boolean(firstError("channel"))}
          aria-describedby={firstError("channel") ? "feedback-channel-error" : undefined}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        >
          <option value="">Select a channel</option>
          {FEEDBACK_CHANNELS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {firstError("channel") ? (
          <p id="feedback-channel-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("channel")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="customer-label" className="block text-sm font-bold text-slate-800">
            Customer label
            <span className="ml-1 font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="customer-label"
            name="customerLabel"
            type="text"
            maxLength={160}
            value={customerLabel}
            onChange={(event) => setCustomerLabel(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={Boolean(firstError("customerLabel"))}
            aria-describedby={
              firstError("customerLabel") ? "customer-label-error" : undefined
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Acme Cloud"
          />
          {firstError("customerLabel") ? (
            <p id="customer-label-error" className="mt-2 text-sm font-medium text-red-700">
              {firstError("customerLabel")}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="source-ref" className="block text-sm font-bold text-slate-800">
            Source reference
            <span className="ml-1 font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="source-ref"
            name="sourceRef"
            type="text"
            maxLength={255}
            value={sourceRef}
            onChange={(event) => setSourceRef(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={Boolean(firstError("sourceRef"))}
            aria-describedby={firstError("sourceRef") ? "source-ref-error" : undefined}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="TICKET-1048"
          />
          {firstError("sourceRef") ? (
            <p id="source-ref-error" className="mt-2 text-sm font-medium text-red-700">
              {firstError("sourceRef")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm leading-6 text-violet-900">
        New items are saved with a <strong>PENDING</strong> classification state until automated
        classification is applied server-side.
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving feedback…" : "Add feedback"}
      </button>
    </form>
  );
}