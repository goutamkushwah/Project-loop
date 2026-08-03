import type { Metadata } from "next";
import Link from "next/link";

import { DashboardAnalyticsPanel } from "@/components/dashboard/dashboard-analytics";
import { requireCurrentUser } from "@/lib/auth";
import { getRolePermissions, getRoleSummary, hasPermission, PERMISSIONS } from "@/lib/rbac";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Protected LOOP workspace dashboard.",
};

const ROLE_CAPABILITY_LABELS: Record<string, string> = {
  "dashboard.read": "View workspace dashboard",
  "feedback.read": "Read customer feedback",
  "feedback.create": "Ingest customer feedback",
  "feedback.update": "Triage and manage feedback",
  "members.read": "View workspace members",
  "members.manage": "Invite members and manage roles",
  "reports.read": "View saved reports",
  "reports.create": "Generate reports",
  "settings.read": "Access workspace settings",
};

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const permissions = getRolePermissions(user.role);
  const canCreateFeedback = hasPermission(user.role, PERMISSIONS.FEEDBACK_CREATE);
  const canManageMembers = hasPermission(user.role, PERMISSIONS.MEMBERS_READ);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
            Week 2 core application
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Welcome, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Authentication, workspace isolation, role enforcement, manual entry, CSV import, and
            simulated channel pulls are now connected inside {user.workspace.name}.
          </p>
        </div>

        <span className="w-fit rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
          {user.role}
        </span>
      </div>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-xl text-violet-800"
          >
            ✦
          </span>
          <p className="mt-5 text-sm font-bold text-loop-700">Feedback record</p>
          <h2 className="mt-2 text-2xl font-black text-loop-900">
            {canCreateFeedback ? "Add customer feedback" : "Review customer feedback"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {canCreateFeedback
              ? "Create manual entries, import validated CSV files, pull simulated channels, and review tenant-scoped records."
              : "Open the workspace feedback record with read-only viewer access."}
          </p>
          <Link
            href="/inbox"
            className="mt-7 inline-flex rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Open feedback
          </Link>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold text-loop-700">Current role</p>
          <h2 className="mt-2 text-3xl font-black text-loop-900">{user.role}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600">{getRoleSummary(user.role)}</p>

          <dl className="mt-7 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Workspace</dt>
              <dd className="mt-2 font-semibold text-slate-900">{user.workspace.name}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</dt>
              <dd className="mt-2 break-words font-semibold text-slate-900">{user.email}</dd>
            </div>
          </dl>

          {canManageMembers ? (
            <Link
              href="/settings/members"
              className="mt-7 inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
            >
              Manage workspace members
            </Link>
          ) : null}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-loop-700">Server-enforced permissions</p>
              <h2 className="mt-2 text-2xl font-black text-loop-900">Role capabilities</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">
              {permissions.length}
            </span>
          </div>

          <ul className="mt-7 space-y-3" aria-label={`${user.role} permissions`}>
            {permissions.map((permission) => (
              <li
                key={permission}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"
              >
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-black text-emerald-700"
                >
                  ✓
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {ROLE_CAPABILITY_LABELS[permission] ?? permission}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{permission}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
      <div className="mt-8">
        <DashboardAnalyticsPanel />
      </div>

      <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-800">
          Tenant-isolation rule
        </p>
        <h2 className="mt-2 text-xl font-black text-amber-950">
          Feedback ownership comes from the authenticated server session.
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-900">
          The feedback APIs never accept an authoritative workspace identifier from the browser. They
          derive the workspace from the active database user and scope every manual create, CSV
          import, simulated pull, count, and list query to that tenant.
        </p>
      </section>
    </main>
  );
}