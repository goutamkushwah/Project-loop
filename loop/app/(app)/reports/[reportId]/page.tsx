import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportDetail } from "@/components/reports/report-detail";
import { ReportShareControl } from "@/components/reports/report-share-control";
import { requirePagePermission } from "@/lib/authorization";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { reportIdSchema } from "@/lib/report-validation";
import { getWorkspaceReport } from "@/services/report-service";

export const metadata: Metadata = {
  title: "Voice-of-Customer Report",
};

export const dynamic = "force-dynamic";

type ReportDetailPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const user = await requirePagePermission(PERMISSIONS.REPORTS_READ);

  const routeParams = await params;

  const parsedId = reportIdSchema.safeParse(routeParams.reportId);

  if (!parsedId.success) {
    notFound();
  }

  const report = await getWorkspaceReport(user.workspaceId, parsedId.data);
  if (!report) {
    notFound();
  }

  const canShare = hasPermission(user.role, PERMISSIONS.REPORTS_SHARE);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-7 flex flex-col gap-5 border-b border-slate-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link
            href="/reports"
            className="text-sm font-bold text-loop-700 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            ← Saved reports
          </Link>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-loop-900 sm:text-4xl">
            {report.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Saved {new Date(report.createdAt).toLocaleString("en", {
              timeZone: "UTC",
              timeZoneName: "short",
            })}
            {report.generatedBy ? ` · ${report.generatedBy.name}` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[360px]">
          <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
            Saved report
          </span>
          {canShare ? (
            <ReportShareControl reportId={report.id} initialSharing={report.sharing} />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600 shadow-sm">
              Your Viewer role can read this saved report but cannot publish or rotate a public share link.
            </div>
          )}
        </div>
      </div>

      <ReportDetail report={report} />
    </main>
  );
}