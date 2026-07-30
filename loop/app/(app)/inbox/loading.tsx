export default function InboxLoading() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-5 py-10 sm:px-8 sm:py-14" aria-busy="true">
      <div className="border-b border-slate-200 pb-8">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-72 rounded bg-slate-200" />
        <div className="mt-4 h-5 max-w-2xl rounded bg-slate-200" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="h-[42rem] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-64 rounded bg-slate-200" />
          <div className="mt-8 h-52 rounded-2xl bg-slate-100" />
          <div className="mt-5 h-12 rounded-xl bg-slate-100" />
          <div className="mt-5 h-12 rounded-xl bg-slate-100" />
        </div>

        <div className="h-[42rem] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="mt-4 h-8 w-56 rounded bg-slate-200" />
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-40 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading feedback workspace</span>
    </main>
  );
}