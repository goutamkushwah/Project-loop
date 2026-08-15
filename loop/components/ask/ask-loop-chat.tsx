"use client";

import { type FormEvent, useState } from "react";

import { ASK_LOOP_MAX_QUESTION_LENGTH } from "@/lib/ask-validation";
import { getFeedbackChannelLabel } from "@/lib/feedback-catalog";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { AskLoopAnswer } from "@/types/ask";

type AskLoopChatProps = {
  disabled: boolean;
};

type ConversationTurn = {
  id: number;
  answer: AskLoopAnswer;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function similarityLabel(value: number): string {
  return `${Math.max(0, value * 100).toFixed(0)}% semantic match`;
}

export function AskLoopChat({ disabled }: AskLoopChatProps) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextId, setNextId] = useState(1);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
        }),
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<{ answer: AskLoopAnswer }>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setError(!result.success ? result.error.message : "Ask LOOP could not answer the question.");
        return;
      }

      setTurns((current) => [
        ...current,
        {
          id: nextId,
          answer: result.data.answer,
        },
      ]);
      setNextId((current) => current + 1);
      setQuestion("");
    } catch {
      setError("Ask LOOP is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function useExampleQuestion() {
    setQuestion("What are users saying about onboarding?");
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-loop-900">Grounded workspace Q&amp;A</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Answers are generated only after semantic retrieval and list the specific feedback used as evidence.
            </p>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">
            Retrieval before generation
          </span>
        </div>
      </div>

      <div className="min-h-80 space-y-6 px-5 py-6 sm:px-7" aria-live="polite">
        {turns.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center">
            <div className="max-w-lg">
              <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-loop-100 text-xl font-black text-loop-900">
                ?
              </span>
              <h2 className="mt-4 text-xl font-black text-slate-900">Ask about real customer feedback</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                LOOP embeds your question, retrieves the closest workspace feedback, and sends only that evidence to Gemini.
              </p>
              <button
                type="button"
                onClick={useExampleQuestion}
                disabled={disabled}
                className="mt-5 rounded-xl border border-loop-200 bg-loop-50 px-4 py-2.5 text-sm font-bold text-loop-800 transition hover:bg-loop-100 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                What are users saying about onboarding?
              </button>
            </div>
          </div>
        ) : (
          turns.map((turn) => (
            <article key={turn.id} className="space-y-4">
              <div className="ml-auto max-w-3xl rounded-2xl rounded-br-md bg-loop-900 px-5 py-4 text-sm leading-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-loop-200">You</p>
                <p className="mt-2">{turn.answer.question}</p>
              </div>

              <div className="max-w-4xl rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.14em] text-loop-700">LOOP</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                      turn.answer.evidenceSufficient
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                        : "bg-amber-50 text-amber-800 ring-amber-200"
                    }`}
                  >
                    {turn.answer.evidenceSufficient ? "Grounded answer" : "Insufficient evidence"}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                  {turn.answer.answer}
                </p>

                <p className="mt-4 text-xs text-slate-500">
                  Retrieved {turn.answer.retrievedEvidenceCount} candidate feedback items before generation.
                </p>

                {turn.answer.sources.length > 0 ? (
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <h3 className="text-sm font-black text-slate-900">Evidence cited</h3>
                    <ol className="mt-3 space-y-3">
                      {turn.answer.sources.map((source, index) => (
                        <li key={source.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                            <span className="grid size-6 place-items-center rounded-full bg-loop-100 font-black text-loop-800">
                              {index + 1}
                            </span>
                            <span>{getFeedbackChannelLabel(source.channel)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatDate(source.createdAt)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{similarityLabel(source.similarity)}</span>
                            {source.customerLabel ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{source.customerLabel}</span>
                              </>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-6 text-slate-700">{source.content}</p>
                          <p className="mt-3 text-xs font-semibold text-slate-500">
                            Feedback ID: <span className="font-mono text-slate-700">{source.id}</span>
                          </p>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <form onSubmit={submitQuestion} className="border-t border-slate-200 bg-slate-50 p-5 sm:p-7">
        {error ? (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        {disabled ? (
          <div role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No feedback embeddings are available yet. Run the embedding backfill before asking questions.
          </div>
        ) : null}

        <label htmlFor="ask-loop-question" className="block text-sm font-black text-slate-900">
          Ask a question
        </label>
        <textarea
          id="ask-loop-question"
          rows={3}
          required
          minLength={3}
          maxLength={ASK_LOOP_MAX_QUESTION_LENGTH}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={disabled || isSubmitting}
          placeholder="What are users saying about onboarding?"
          className="mt-2 w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {question.length.toLocaleString()} / {ASK_LOOP_MAX_QUESTION_LENGTH.toLocaleString()} characters
          </p>
          <button
            type="submit"
            disabled={disabled || isSubmitting || question.trim().length < 3}
            className="inline-flex items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Retrieving evidence and answering…" : "Ask LOOP"}
          </button>
        </div>
      </form>
    </section>
  );
}