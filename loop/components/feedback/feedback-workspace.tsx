"use client";

import { useState } from "react";

import { FeedbackEntryForm } from "@/components/feedback/feedback-entry-form";
import { FeedbackList } from "@/components/feedback/feedback-list";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { FeedbackListItem, FeedbackPage } from "@/types/feedback";

type FeedbackWorkspaceProps = {
  initialPage: FeedbackPage;
  canCreate: boolean;
};

const PAGE_SIZE = 10;

export function FeedbackWorkspace({ initialPage, canCreate }: FeedbackWorkspaceProps) {
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadPage(nextPage: number) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch(
        `/api/feedback?page=${nextPage}&pageSize=${PAGE_SIZE}&sortOrder=desc`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      const result = (await response.json()) as
        | ApiSuccessResponse<FeedbackPage>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setLoadError(
          !result.success ? result.error.message : "Feedback could not be loaded.",
        );
        return;
      }

      setPage(result.data);
    } catch {
      setLoadError("Feedback is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreated(feedback: FeedbackListItem) {
    setNotice(`Feedback from ${feedback.customerLabel ?? "the selected channel"} was saved.`);
    await loadPage(1);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
          Single entry
        </p>
        <h2 className="mt-2 text-2xl font-black text-loop-900">Add customer feedback</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Record one customer comment with its source channel. Content and channel are required.
        </p>

        <div className="mt-7">
          {canCreate ? (
            <FeedbackEntryForm onCreated={handleCreated} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-bold text-slate-900">Read-only workspace access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Viewers can read workspace feedback but cannot create or modify records. The API
                enforces this restriction with HTTP 403.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
              Workspace record
            </p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Recent feedback</h2>
          </div>
          <span className="w-fit rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-800 ring-1 ring-inset ring-violet-200">
            AI classification pending
          </span>
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            {notice}
          </div>
        ) : null}

        <FeedbackList
          page={page}
          isLoading={isLoading}
          error={loadError}
          onPageChange={(nextPage) => {
            setNotice(null);
            void loadPage(nextPage);
          }}
          onRetry={() => void loadPage(page.pagination.page)}
        />
      </section>
    </div>
  );
}