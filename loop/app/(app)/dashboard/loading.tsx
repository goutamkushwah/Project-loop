export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-5 py-10 sm:px-8 sm:py-14" aria-busy="true">
      <div className="border-b border-slate-200 pb-8">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="mt-4 h-11 w-full max-w-xl rounded bg-slate-200" />
        <div className="mt-4 h-5 w-full max-w-3xl rounded bg-slate-200" />
      </div>

      <div className="mt-8 h-44 rounded-3xl border border-slate-200 bg-white" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-36 rounded-3xl border border-slate-200 bg-white" />
        ))}
      </div>

      <div className="mt-6 h-96 rounded-3xl border border-slate-200 bg-white" />
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-96 rounded-3xl border border-slate-200 bg-white" />
        <div className="h-96 rounded-3xl border border-slate-200 bg-white" />
      </div>

      <span className="sr-only">Loading dashboard analytics.</span>
    </main>
  );
}