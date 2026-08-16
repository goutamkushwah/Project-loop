import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested LOOP page could not be found.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto grid min-h-screen max-w-3xl place-items-center px-5 py-16 text-center outline-none sm:px-8">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-loop-100 text-xl font-black text-loop-900"
        >
          404
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
          Page not found
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-loop-900 sm:text-4xl">
          This LOOP page does not exist.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          The address may be outdated, incomplete, or no longer available. No workspace data was changed.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            LOOP home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}