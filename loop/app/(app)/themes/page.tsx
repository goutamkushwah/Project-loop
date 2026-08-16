import type { Metadata } from "next";

import { ThemeCatalog } from "@/components/themes/theme-catalog";
import { requirePagePermission } from "@/lib/authorization";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { themeListQuerySchema } from "@/lib/theme-validation";
import { listWorkspaceThemes } from "@/services/theme-service";

export const metadata: Metadata = {
  title: "Themes",
  description:
    "Explore tenant-scoped customer-feedback theme clusters and their underlying evidence.",
};

export const dynamic = "force-dynamic";

type ThemesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ThemesPage({ searchParams }: ThemesPageProps) {
  const user = await requirePagePermission(PERMISSIONS.THEMES_READ);
  const canCluster = hasPermission(user.role, PERMISSIONS.THEMES_CLUSTER);

  const params = await searchParams;

  const parsedQuery = themeListQuerySchema.safeParse({
    page: firstValue(params?.page),
    pageSize: 12,
    search: firstValue(params?.search) ?? "",
    sortBy: firstValue(params?.sortBy) ?? "count",
    sortOrder: firstValue(params?.sortOrder) ?? "desc",
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
          
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">Theme clusters</h1>
          
        </div>

        <span className="w-fit rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
          {user.role}
        </span>
      </div>

      {!parsedQuery.success ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900"
        >
          The requested theme query was invalid, so LOOP restored the default theme view.
        </div>
      ) : null}

      <div className="mt-8">
        <ThemeCatalog page={page} canCluster={canCluster} />
      </div>
    </main>
  );
}
