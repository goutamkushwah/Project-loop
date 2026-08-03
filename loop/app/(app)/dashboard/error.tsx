"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm sm:p-12">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl text-red-700"
        >
          !
        </span>
        <h1 className="mt-6 text-3xl font-black text-slate-900">Dashboard analytics could not load</h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          LOOP could not read the current workspace analytics. Your data has not been changed.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}