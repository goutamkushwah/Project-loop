import type { Metadata } from "next";
import Link from "next/link";

import { TrendsFilterBar } from "@/components/trends/trends-filter-bar";
import { TrendsView } from "@/components/trends/trends-view";
import { requirePagePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { getDefaultTrendRange, trendQuerySchema } from "@/lib/trend-validation";
import { getWorkspaceThemeTrends } from "@/services/trend-service";

export const metadata: Metadata = {
  title: "Theme trends",
  description: "Compare tenant-scoped theme volume and identify customer-feedback spikes.",
};

export const dynamic = "force-dynamic";

type TrendsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TrendsPage({ searchParams }: TrendsPageProps) {
  const user = await requirePagePermission(PERMISSIONS.THEMES_READ);

  const params = await searchParams;

  const parsedQuery = trendQuerySchema.safeParse({
    dateFrom: firstValue(params?.dateFrom),
    dateTo: firstValue(params?.dateTo),
    channel: firstValue(params?.channel),
    status: firstValue(params?.status),
  });
  const fallbackRange = getDefaultTrendRange();
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        ...fallbackRange,
        channel: null,
        status: null,
      };
  const trends = await getWorkspaceThemeTrends(user.workspaceId, query);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">Theme trends</h1>
          
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
            {user.role}
          </span>
          <Link
            href="/themes"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            Explore themes
          </Link>
        </div>
      </div>

      {!parsedQuery.success ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900"
        >
          The requested trend filters were invalid, so LOOP restored the default 30-day comparison.
        </div>
      ) : null}

      <div className="mt-8">
        <TrendsFilterBar query={trends.query} />
      </div>

      <div className="mt-6">
        <TrendsView data={trends} />
      </div>
    </main>
  );
}
