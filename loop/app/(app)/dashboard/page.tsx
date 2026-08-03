import type { Metadata } from "next";
import Link from "next/link";

import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { requirePagePermission } from "@/lib/authorization";
import { dashboardQuerySchema, getDefaultDashboardRange } from "@/lib/dashboard-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { getWorkspaceDashboardAnalytics } from "@/services/dashboard-service";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tenant-scoped customer-feedback analytics dashboard.",
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requirePagePermission(PERMISSIONS.DASHBOARD_READ);

  const params = await searchParams;

  const rawQuery = {
    dateFrom: firstSearchValue(params?.dateFrom),
    dateTo: firstSearchValue(params?.dateTo),
    channel: firstSearchValue(params?.channel),
    status: firstSearchValue(params?.status),
  };
  const parsedQuery = dashboardQuerySchema.safeParse(rawQuery);
  const fallbackRange = getDefaultDashboardRange();
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        ...fallbackRange,
        channel: null,
        status: null,
      };
  const analytics = await getWorkspaceDashboardAnalytics(user.workspaceId, query);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
<<<<<<< HEAD
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
            Week 2 core application
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Welcome, {user.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Authentication, workspace isolation, three ingestion paths, server-side search, pagination,
            compound inbox filters, and the feedback status workflow are now connected inside {user.workspace.name}.
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
            {canCreateFeedback ? "Search and triage feedback" : "Search customer feedback"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {canCreateFeedback
              ? "Create records through three ingestion paths, combine search with five filter dimensions, and move feedback through the triage workflow."
              : "Search, filter, and paginate tenant-scoped feedback with read-only viewer access."}
          </p>
=======
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
           core application
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Customer feedback at a glance
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Volume, stored sentiment, and theme assignments are calculated from real records in the
            isolated {user.workspace.name} workspace. Every chart uses one server-validated filter
            set.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
            {user.role}
          </span>
>>>>>>> c87dbf9f41788c6279f81b001d740f99e1a6c0b9
          <Link
            href="/inbox"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Open inbox
          </Link>
        </div>
      </div>

<<<<<<< HEAD
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

      <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-800">
          Tenant-isolation rule
        </p>
        <h2 className="mt-2 text-xl font-black text-amber-950">
          Feedback ownership comes from the authenticated server session.
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-amber-900">
          The feedback APIs never accept an authoritative workspace identifier from the browser. They
          derive the workspace from the active database user and scope every ingestion, search, filter,
          pagination, lookup, and status mutation to that tenant.
=======
      {!parsedQuery.success ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900"
        >
          The requested dashboard filters were invalid, so LOOP restored the default 30-day view.
        </div>
      ) : null}

      <div className="mt-8">
        <DashboardFilterBar query={analytics.query} />
      </div>

      <div className="mt-6">
        <DashboardAnalytics data={analytics} />
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
       
        <h2 className="mt-2 text-xl font-black text-slate-900">
          No analytics values are fabricated.
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          Volume and stat totals come directly from PostgreSQL. Sentiment and theme charts remain in
          intentional empty states until the scheduled AI classification and clustering work stores
          real results.
>>>>>>> c87dbf9f41788c6279f81b001d740f99e1a6c0b9
        </p>
      </section>
    </main>
  );
}
