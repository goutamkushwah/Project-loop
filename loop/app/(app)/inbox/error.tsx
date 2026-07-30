"use client";

import Link from "next/link";
import { useEffect } from "react";

type InboxErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function InboxError({ error, reset }: InboxErrorProps) {
  useEffect(() => {
    console.error("Feedback page failed.", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm sm:p-12">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-700"
        >
          !
        </span>
        <h1 className="mt-6 text-3xl font-black text-slate-950">
          Feedback could not be opened
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
          The workspace feedback record is temporarily unavailable. Retry the server request or
          return to the dashboard.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}