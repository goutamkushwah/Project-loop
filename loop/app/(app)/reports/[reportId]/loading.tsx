export default function ReportDetailLoading() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-5 py-10 sm:px-8 sm:py-14" aria-busy="true" aria-label="Loading Voice-of-Customer report">
      <div className="h-5 w-32 rounded bg-slate-200" />
      <div className="mt-4 h-10 w-96 max-w-full rounded bg-slate-200" />
      <div className="mt-8 h-72 rounded-3xl bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-2xl bg-white shadow-sm" />)}</div>
      <div className="mt-6 h-96 rounded-3xl bg-white shadow-sm" />
    </main>
  );
}