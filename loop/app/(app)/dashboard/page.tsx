import type { Metadata } from "next";
import Link from "next/link";

import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { requirePagePermission } from "@/lib/authorization";
import { dashboardQuerySchema, getDefaultDashboardRange } from "@/lib/dashboard-validation";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { getWorkspaceDashboardAnalytics } from "@/services/dashboard-service";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tenant-scoped customer-feedback analytics dashboard.",
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requirePagePermission(PERMISSIONS.DASHBOARD_READ);
  const canClassify = hasPermission(user.role, PERMISSIONS.AI_CLASSIFY);

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
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
            Week 3 AI integration
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Customer feedback at a glance
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Volume, stored sentiment, and theme assignments are calculated from real records in the
            isolated {user.workspace.name} workspace. The Claude classification service is now ready
            for validated previews before Day 12 persistence.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
            {user.role}
          </span>
          {canClassify ? (
            <Link
              href="/ai/classification"
              className="inline-flex items-center rounded-xl bg-loop-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
            >
              Test AI classification
            </Link>
          ) : null}
          <Link
            href="/inbox"
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Open inbox
          </Link>
        </div>
      </div>

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
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">
          Day 11 data boundary
        </p>
        <h2 className="mt-2 text-xl font-black text-slate-900">
          Claude output is validated but not stored yet.
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          The classification lab proves server-side Claude connectivity, strict JSON parsing, Zod
          validation, and repair handling. Dashboard sentiment and theme charts continue to use
          stored database values only. Day 12 will persist real classification results and back-fill
          pending feedback.
        </p>
      </section>
    </main>
  );
}
