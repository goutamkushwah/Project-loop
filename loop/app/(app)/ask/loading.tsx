export default function AskLoopLoading() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14" aria-busy="true">
      <div className="animate-pulse">
        <div className="h-4 w-44 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-64 rounded bg-slate-200" />
        <div className="mt-4 h-5 max-w-3xl rounded bg-slate-200" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="mt-6 h-[34rem] rounded-3xl bg-slate-200" />
      </div>
    </main>
  );
}
