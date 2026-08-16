export default function SharedReportLoading() {
  return (
    <div className="min-h-screen bg-slate-50" aria-busy="true" aria-label="Loading shared report">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="h-10 w-44 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-5 py-10 outline-none sm:px-8 sm:py-14">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-2xl bg-slate-200" />
          <div className="h-72 rounded-3xl bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-64 rounded-3xl bg-slate-200" />
            <div className="h-64 rounded-3xl bg-slate-200" />
          </div>
        </div>
        <span className="sr-only">Loading the shared Voice-of-Customer report.</span>
      </main>
    </div>
  );
}