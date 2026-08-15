export default function ThemeDetailLoading() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14" aria-busy="true">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-5 h-10 w-80 rounded bg-slate-200" />
        <div className="mt-4 h-5 max-w-2xl rounded bg-slate-200" />
        <div className="mt-10 h-28 rounded-3xl bg-slate-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-48 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </main>
  );
}