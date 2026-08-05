export default function AiClassificationLoading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14" aria-busy="true">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="h-[38rem] animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-[38rem] animate-pulse rounded-3xl bg-slate-100" />
      </div>
    </main>
  );
}