import Link from "next/link";

import type { VoiceOfCustomerReportDetail } from "@/types/report";

type ReportDetailProps = {
  report: VoiceOfCustomerReportDetail;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatDelta(value: number): string {
  if (value === 0) return "0 pp";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} pp`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function ReportDetail({ report }: ReportDetailProps) {
  const { content } = report;
  const evidenceById = new Map(content.evidence.map((item) => [item.feedbackId, item]));
  const themeById = new Map(content.topThemes.map((theme) => [theme.id, theme]));
  const notableQuotes = content.narrative.notableQuoteIds
    .map((id) => evidenceById.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-loop-200 bg-gradient-to-br from-loop-900 to-violet-900 p-6 text-white shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-loop-200">Voice of Customer</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">{content.narrative.headline}</h2>
        <p className="mt-5 max-w-4xl text-base leading-7 text-slate-100">{content.narrative.executiveSummary}</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold text-slate-200">
          <span className="rounded-full bg-white/10 px-3 py-1.5">{content.period.dateFrom} → {content.period.dateTo}</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5">{content.period.dayCount} days</span>
          <span className="rounded-full bg-white/10 px-3 py-1.5">{content.provider} · {content.model}</span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report statistics">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Feedback</p>
          <p className="mt-2 text-3xl font-black text-loop-900">{formatNumber(content.stats.totalFeedback)}</p>
          <p className="mt-1 text-xs text-slate-500">Previous period: {formatNumber(content.stats.previousTotalFeedback)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Classification coverage</p>
          <p className="mt-2 text-3xl font-black text-loop-900">{formatPercent(content.stats.classificationCoverage)}</p>
          <p className="mt-1 text-xs text-slate-500">{formatNumber(content.stats.classifiedFeedback)} classified items</p>
        </article>
        {content.sentiment.filter((item) => item.sentiment === "NEG").map((item) => (
          <article key={item.sentiment} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Negative share</p>
            <p className="mt-2 text-3xl font-black text-loop-900">{formatPercent(item.percentage)}</p>
            <p className="mt-1 text-xs text-slate-500">{formatDelta(item.deltaPercentagePoints)} vs previous period</p>
          </article>
        ))}
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Top themes</p>
          <p className="mt-2 text-3xl font-black text-loop-900">{content.topThemes.length}</p>
          <p className="mt-1 text-xs text-slate-500">Ranked by real feedback assignments</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Sentiment shift</p>
          <h3 className="mt-2 text-2xl font-black text-loop-900">Current vs previous period</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">{content.narrative.sentimentSummary}</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                <tr><th className="py-3 pr-4">Sentiment</th><th className="py-3 pr-4">Current</th><th className="py-3 pr-4">Previous</th><th className="py-3">Shift</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {content.sentiment.map((item) => (
                  <tr key={item.sentiment}>
                    <td className="py-3 pr-4 font-bold text-slate-800">{item.label}</td>
                    <td className="py-3 pr-4 text-slate-600">{formatPercent(item.percentage)} ({formatNumber(item.count)})</td>
                    <td className="py-3 pr-4 text-slate-600">{formatPercent(item.previousPercentage)} ({formatNumber(item.previousCount)})</td>
                    <td className="py-3 font-bold text-slate-800">{formatDelta(item.deltaPercentagePoints)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Themes</p>
          <h3 className="mt-2 text-2xl font-black text-loop-900">What customers are talking about</h3>
          {content.topThemes.length === 0 ? (
            <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">No stored theme assignments were available in this period.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {content.topThemes.map((theme) => {
                const insight = content.narrative.themeInsights.find((item) => item.themeId === theme.id);
                return (
                  <div key={theme.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-black text-slate-900"><span className="size-2.5 rounded-full" style={{ backgroundColor: theme.color }} aria-hidden="true" />{theme.name}</span>
                      <span className="text-sm font-bold text-slate-600">{formatNumber(theme.count)} · {formatPercent(theme.percentage)}</span>
                    </div>
                    {insight ? <p className="mt-3 text-sm leading-6 text-slate-600">{insight.insight}</p> : null}
                    <Link href={`/inbox?themeId=${encodeURIComponent(theme.id)}&dateFrom=${content.period.dateFrom}&dateTo=${content.period.dateTo}`} className="mt-3 inline-flex text-sm font-bold text-loop-700 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">View underlying feedback →</Link>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Customer voice</p>
        <h3 className="mt-2 text-2xl font-black text-loop-900">Notable verbatim feedback</h3>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {notableQuotes.map((item) => (
            <blockquote key={item.feedbackId} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">“{item.content}”</p>
              <footer className="mt-4 text-xs text-slate-500">
                {item.customerLabel ?? "Anonymous customer"} · {item.channel} · {formatDate(item.createdAt)}
              </footer>
              <Link href={`/inbox?search=${encodeURIComponent(item.content.slice(0, 80))}`} className="mt-3 inline-flex text-xs font-bold text-loop-700 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2">Open evidence</Link>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-loop-600">Recommended actions</p>
        <h3 className="mt-2 text-2xl font-black text-loop-900">What to do next</h3>
        <ol className="mt-5 space-y-4">
          {content.narrative.recommendedActions.map((action, index) => (
            <li key={`${action.title}-${index}`} className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start gap-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-loop-100 text-sm font-black text-loop-800">{index + 1}</span>
                <div>
                  <h4 className="font-black text-slate-900">{action.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{action.rationale}</p>
                  {action.relatedThemeIds.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {action.relatedThemeIds.map((themeId) => {
                        const theme = themeById.get(themeId);
                        return theme ? <span key={themeId} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{theme.name}</span> : null;
                      })}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2" aria-label="Recommendation evidence">
                    {action.evidenceFeedbackIds.map((feedbackId) => {
                      const evidence = evidenceById.get(feedbackId);
                      return evidence ? (
                        <Link
                          key={feedbackId}
                          href={`/inbox?search=${encodeURIComponent(evidence.content.slice(0, 80))}`}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-loop-700 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
                        >
                          Evidence {feedbackId.slice(0, 8)}
                        </Link>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}