import type { Metadata } from "next";

import { requireCurrentUser } from "@/lib/auth";
import { getRoleSummary } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your LOOP account details.",
};

export default async function ProfilePage() {
  const user = await requireCurrentUser();

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
        Your account
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
        Profile
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        Account details are read from your active session and workspace
        record.
      </p>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-loop-900 text-xl font-black text-white">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <span className="ml-auto w-fit rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
            {user.role}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Workspace
            </dt>
            <dd className="mt-2 font-semibold text-slate-900">
              {user.workspace.name}
            </dd>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Account status
            </dt>
            <dd className="mt-2 font-semibold text-slate-900">
              {user.isActive ? "Active" : "Inactive"}
            </dd>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Member since
            </dt>
            <dd className="mt-2 font-semibold text-slate-900">
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </dd>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Last login
            </dt>
            <dd className="mt-2 font-semibold text-slate-900">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "This is your first session"}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-2xl bg-loop-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-loop-700">
            What your role can do
          </p>
          <p className="mt-1 text-sm leading-6 text-loop-900">
            {getRoleSummary(user.role)}
          </p>
        </div>
      </section>
    </main>
  );
}
