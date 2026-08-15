"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ReportsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Reports route failed.", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-red-600">Reports unavailable</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">LOOP could not load saved reports.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Retry the request. If the problem continues, verify the PostgreSQL connection and server logs.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={reset} className="rounded-xl bg-loop-900 px-4 py-2 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">Retry</button>
          <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">Dashboard</Link>
        </div>
      </div>
    </main>
  );
}