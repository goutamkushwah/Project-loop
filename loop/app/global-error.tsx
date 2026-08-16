"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("LOOP global error boundary captured an error.", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-950">
        <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-5 py-16 text-center sm:px-8">
          <section role="alert" className="w-full rounded-3xl border border-red-200 bg-white p-8 shadow-sm sm:p-12">
            <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-2xl font-black text-red-700">
              !
            </span>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-red-700">Critical application error</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">LOOP needs to reload.</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              The application shell could not be rendered safely. Retry the page; if the problem continues, review the server logs using the reference below.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
            >
              Reload LOOP
            </button>
            {error.digest ? <p className="mt-5 text-xs text-slate-400">Reference: <span className="font-mono">{error.digest}</span></p> : null}
          </section>
        </main>
      </body>
    </html>
  );
}