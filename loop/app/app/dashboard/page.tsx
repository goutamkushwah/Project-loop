import type { Metadata } from "next";

import { requireCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Protected LOOP workspace dashboard.",
};

const authenticationChecks = [
  {
    title: "Authenticated session",
    description: "The page is rendered only after the server validates the signed session cookie.",
  },
  {
    title: "Database user verified",
    description: "The current user must still exist and remain active in the authenticated workspace.",
  },
  {
    title: "Protected navigation",
    description: "Logged-out requests are redirected to the custom LOOP sign-in page.",
  },
] as const;

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
            Authentication foundation
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Welcome, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            You are signed in to the protected {user.workspace.name} workspace. Role enforcement and
            member administration are implemented on Day 4.
          </p>
        </div>

        <span className="w-fit rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
          {user.role}
        </span>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-3" aria-label="Authentication checks">
        {authenticationChecks.map((check) => (
          <article key={check.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-xl bg-emerald-50 font-black text-emerald-700"
            >
              ✓
            </span>
            <h2 className="mt-5 text-lg font-bold text-slate-900">{check.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{check.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold text-loop-700">Current authenticated identity</p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Session details</h2>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">
            Active
          </span>
        </div>

        <dl className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-2 break-words text-sm font-semibold text-slate-900">{user.name}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-2 break-words text-sm font-semibold text-slate-900">{user.email}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Workspace</dt>
            <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
              {user.workspace.name}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Role</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-900">{user.role}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}