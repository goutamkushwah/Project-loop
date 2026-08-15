import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportDetail } from "@/components/reports/report-detail";
import { ReportPdfDownload } from "@/components/reports/report-pdf-download";
import { requirePagePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { reportIdSchema } from "@/lib/report-validation";
import { getWorkspaceReport } from "@/services/report-service";

export const metadata: Metadata = {
  title: "Voice-of-Customer Report",
};

export const dynamic = "force-dynamic";

type ReportDetailPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  console.log("REPORT PAGE START");

  const user = await requirePagePermission(PERMISSIONS.REPORTS_READ);

  const { reportId } = await params;

  console.log("REPORT PAGE DEBUG - params:", {
    reportId,
    workspaceId: user.workspaceId,
  });

  const parsedId = reportIdSchema.safeParse(reportId);

  console.log("REPORT PAGE DEBUG - parsedId:", {
    success: parsedId.success,
    reportId,
  });

  if (!parsedId.success) {
    notFound();
  }

  const report = await getWorkspaceReport(
    user.workspaceId,
    parsedId.data,
  );

  console.log("REPORT PAGE DEBUG - report lookup:", {
    reportId: parsedId.data,
    workspaceId: user.workspaceId,
    found: !!report,
  });

  if (!report) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
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
            Saved{" "}
            {new Date(report.createdAt).toLocaleString("en", {
              timeZone: "UTC",
              timeZoneName: "short",
            })}
            {report.generatedBy
              ? ` · ${report.generatedBy.name}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ReportPdfDownload reportId={report.id} />

          <span className="w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">
            Saved report
          </span>
        </div>
      </div>

      <ReportDetail report={report} />
    </main>
  );
}