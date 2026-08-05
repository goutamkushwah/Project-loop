"use client";

export default function AiClassificationError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-5 py-12 text-center sm:px-8">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm sm:p-12">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl text-red-700"
        >
          !
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-900">Classification page unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          LOOP could not load the workspace theme catalog. Retry the request or verify the database
          connection.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}