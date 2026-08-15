import type { Metadata } from "next";

import { ThemeCatalog } from "@/components/themes/theme-catalog";
import { requirePagePermission } from "@/lib/authorization";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { themeListQuerySchema } from "@/lib/theme-validation";
import { listWorkspaceThemes } from "@/services/theme-service";

export const metadata: Metadata = {
  title: "Themes",
  description: "Explore tenant-scoped customer-feedback theme clusters and their underlying evidence.",
};

export const dynamic = "force-dynamic";

type ThemesPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ThemesPage({ searchParams }: ThemesPageProps) {
  const user = await requirePagePermission(PERMISSIONS.THEMES_READ);
  const canCluster = hasPermission(user.role, PERMISSIONS.THEMES_CLUSTER);
  const parsedQuery = themeListQuerySchema.safeParse({
    page: firstValue(searchParams?.page),
    pageSize: 12,
    search: firstValue(searchParams?.search) ?? "",
    sortBy: firstValue(searchParams?.sortBy) ?? "count",
    sortOrder: firstValue(searchParams?.sortOrder) ?? "desc",
  });
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        page: 1,
        pageSize: 12,
        search: "",
        sortBy: "count" as const,
        sortOrder: "desc" as const,
      };
  const page = await listWorkspaceThemes(user.workspaceId, query);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
            AI integration · Day 13
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Theme clusters
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Similar feedback is grouped into named themes inside the isolated {user.workspace.name} workspace.
            Counts come from stored FeedbackTheme assignments, and every theme drills directly into the feedback
            that supports it.
          </p>
        </div>

        <span className="w-fit rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
          {user.role}
        </span>
      </div>

      {!parsedQuery.success ? (
        <div role="alert" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
          The requested theme query was invalid, so LOOP restored the default theme view.
        </div>
      ) : null}

      <div className="mt-8">
        <ThemeCatalog page={page} canCluster={canCluster} />
      </div>
    </main>
  );
}