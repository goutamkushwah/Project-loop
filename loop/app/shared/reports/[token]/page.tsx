import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportDetail } from "@/components/reports/report-detail";
import { reportShareTokenSchema } from "@/lib/report-validation";
import { getSharedVoiceOfCustomerReport } from "@/services/report-service";

export const metadata: Metadata = {
  title: "Shared Voice-of-Customer Report",
  description: "A read-only Voice-of-Customer report shared from LOOP.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const dynamic = "force-dynamic";

type SharedReportPageProps = {
  params: {
    token: string;
  };
};

export default async function SharedReportPage({ params }: SharedReportPageProps) {
  const parsedToken = reportShareTokenSchema.safeParse(params.token);
  if (!parsedToken.success) {
    notFound();
  }

  const report = await getSharedVoiceOfCustomerReport(parsedToken.data);
  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
            aria-label="LOOP home"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-loop-900 font-black text-white">
              L
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-[0.2em] text-loop-900">LOOP</span>
              <span className="block text-xs text-slate-500">Shared Voice-of-Customer report</span>
            </span>
          </Link>
          <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-800">
            Read-only share
          </span>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-5 py-10 outline-none sm:px-8 sm:py-14">
        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-loop-600">
            Shared report
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-loop-900">{report.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This immutable report snapshot was generated from stored workspace feedback for {report.content.period.dateFrom} through {report.content.period.dateTo}. Internal inbox links are intentionally disabled on public shares.
          </p>
        </section>

        <ReportDetail report={report} evidenceLinks={false} />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6 text-xs leading-5 text-slate-500 sm:px-8">
          This link provides read-only access to a saved report snapshot. The workspace can revoke or rotate the link at any time.
        </div>
      </footer>
    </div>
  );
}