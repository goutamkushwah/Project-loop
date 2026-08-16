export default function WorkspaceMembersLoading() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14" aria-busy="true" aria-label="Loading workspace members">
      <div className="animate-pulse border-b border-slate-200 pb-8">
        <div className="h-4 w-48 rounded bg-slate-200" />
        <div className="mt-4 h-10 max-w-md rounded bg-slate-200" />
        <div className="mt-4 h-5 max-w-2xl rounded bg-slate-200" />
      </div>
      <div className="mt-8 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-16 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading workspace members and invitations.</span>
    </main>
  );
}