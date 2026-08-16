import type { Metadata } from "next";

import { ReportGeneratorForm } from "@/components/reports/report-generator-form";
import { ReportList } from "@/components/reports/report-list";
import { requirePagePermission } from "@/lib/authorization";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { getDefaultReportRange, reportListQuerySchema } from "@/lib/report-validation";
import { listWorkspaceReports } from "@/services/report-service";

export const metadata: Metadata = {
  title: "Reports",
  description: "Generate and review evidence-backed Voice-of-Customer reports.",
};

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await requirePagePermission(PERMISSIONS.REPORTS_READ);

  const params = await searchParams;

  const parsedQuery = reportListQuerySchema.safeParse({
    page: first(params?.page),
    pageSize: first(params?.pageSize),
    search: first(params?.search),
    periodFrom: first(params?.periodFrom),
    periodTo: first(params?.periodTo),
    sortBy: first(params?.sortBy),
    sortOrder: first(params?.sortOrder),
  });
  const query = parsedQuery.success ? parsedQuery.data : reportListQuerySchema.parse({});
  const reports = await listWorkspaceReports(user.workspaceId, query);
  const canGenerate = hasPermission(user.role, PERMISSIONS.REPORTS_CREATE);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
            
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Voice-of-Customer reports
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
           
          </p>
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
          The requested report-list filters were invalid, so LOOP restored the default saved-report
          view.
        </div>
      ) : null}

      <div className="mt-8">
        {canGenerate ? (
          <ReportGeneratorForm defaultRange={getDefaultReportRange()} />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-600 shadow-sm">
            Your Viewer role can read saved reports but cannot generate new reports.
          </div>
        )}
      </div>

      <div className="mt-6">
        <ReportList page={reports} />
      </div>
    </main>
  );
}
