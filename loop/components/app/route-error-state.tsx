"use client";

import Link from "next/link";
import { useEffect } from "react";

type RouteErrorStateProps = {
  error?: Error & { digest?: string };
  reset: () => void;
  eyebrow?: string;
  title: string;
  description: string;
  returnHref?: string;
  returnLabel?: string;
  mainId?: string;
};

export function RouteErrorState({
  error,
  reset,
  eyebrow = "Something went wrong",
  title,
  description,
  returnHref = "/dashboard",
  returnLabel = "Return to dashboard",
  mainId,
}: RouteErrorStateProps) {
  useEffect(() => {
    if (error) {
      console.error("LOOP route boundary captured an error.", {
        message: error.message,
        digest: error.digest,
      });
    }
  }, [error]);

  return (
    <main id={mainId} tabIndex={mainId ? -1 : undefined} className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 py-16 text-center outline-none sm:px-8">
      <section
        role="alert"
        aria-labelledby="route-error-title"
        className="w-full rounded-3xl border border-red-200 bg-white p-8 shadow-sm sm:p-12"
      >
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-700"
        >
          !
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-700">
          {eyebrow}
        </p>
        <h1 id="route-error-title" className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href={returnHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            {returnLabel}
          </Link>
        </div>
        {error?.digest ? (
          <p className="mt-5 text-xs text-slate-400">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </section>
    </main>
  );
}