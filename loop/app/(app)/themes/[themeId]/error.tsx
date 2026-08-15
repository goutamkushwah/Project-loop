"use client";

import Link from "next/link";

export default function ThemeDetailError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <h1 className="text-2xl font-black text-red-950">Theme feedback could not be loaded</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-red-800">
          The theme exists, but its underlying feedback could not be loaded safely.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-red-900 px-5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/themes"
            className="rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-bold text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Back to themes
          </Link>
        </div>
      </div>
    </main>
  );
}