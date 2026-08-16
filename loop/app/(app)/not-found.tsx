import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Workspace page not found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WorkspaceNotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-3xl place-items-center px-5 py-16 text-center sm:px-8">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-loop-100 text-xl font-black text-loop-900"
        >
          404
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
          Workspace resource not found
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-loop-900">
          LOOP could not find that resource.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
          It may have been removed, the identifier may be invalid, or it may belong to a different workspace. LOOP does not reveal cross-workspace resource existence.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Return to dashboard
          </Link>
          <Link
            href="/inbox"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Open inbox
          </Link>
        </div>
      </section>
    </main>
  );
}