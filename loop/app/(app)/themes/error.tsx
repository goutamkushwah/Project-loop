"use client";

export default function ThemesError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
        <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-xl shadow-sm">
          !
        </span>
        <h1 className="mt-5 text-2xl font-black text-red-950">Themes could not be loaded</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-red-800">
          LOOP could not load the workspace theme clusters. No data was changed.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-red-900 px-5 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}