export default function ReportsLoading() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-5 py-10 sm:px-8 sm:py-14" aria-busy="true" aria-label="Loading reports">
      <div className="h-4 w-36 rounded bg-slate-200" />
      <div className="mt-4 h-10 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-3 h-5 w-full max-w-2xl rounded bg-slate-200" />
      <div className="mt-8 h-60 rounded-3xl bg-white shadow-sm" />
      <div className="mt-6 h-96 rounded-3xl bg-white shadow-sm" />
    </main>
  );
}