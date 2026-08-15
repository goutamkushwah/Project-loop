export default function ThemesLoading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14" aria-busy="true">
      <div className="animate-pulse">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-72 rounded bg-slate-200" />
        <div className="mt-4 h-5 max-w-2xl rounded bg-slate-200" />
        <div className="mt-8 h-32 rounded-3xl bg-slate-200" />
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 rounded-3xl bg-slate-200" />
          ))}
        </div>
      </div>
    </main>
  );
}