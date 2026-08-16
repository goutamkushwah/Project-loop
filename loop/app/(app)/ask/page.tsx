import type { Metadata } from "next";

import { AskLoopChat } from "@/components/ask/ask-loop-chat";
import { requirePagePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { getWorkspaceEmbeddingCoverage } from "@/services/embedding-service";

export const metadata: Metadata = {
  title: "Ask LOOP",
  description: "Ask plain-English questions and receive answers grounded in workspace feedback.",
};

export const dynamic = "force-dynamic";

export default async function AskLoopPage() {
  const user = await requirePagePermission(PERMISSIONS.ASK_LOOP_QUERY);
  const coverage = await getWorkspaceEmbeddingCoverage(user.workspaceId);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
         
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Ask LOOP
          </h1>
          
        </div>

        <span className="w-fit rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
          {user.role}
        </span>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Ask LOOP search index status">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Indexed</p>
          <p className="mt-2 text-2xl font-black text-loop-900">
            {coverage.embeddedFeedback.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-slate-600">feedback items ready for semantic retrieval</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Coverage</p>
          <p className="mt-2 text-2xl font-black text-loop-900">{coverage.coveragePercentage}%</p>
          <p className="mt-1 text-sm text-slate-600">
            {coverage.missingFeedback.toLocaleString()} feedback items still need embeddings
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Embedding index</p>
          <p className="mt-2 truncate text-lg font-black text-loop-900">{coverage.model}</p>
          <p className="mt-1 text-sm text-slate-600">{coverage.dimensions}-dimension vectors</p>
        </article>
      </section>

      {coverage.totalFeedback > 0 && coverage.missingFeedback > 0 ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
        >
         Ask LOOP searches indexed feedback only. Run the embedding backfill command so existing seeded feedback is included in semantic retrieval.
        </div>
      ) : null}

      <div className="mt-6">
        <AskLoopChat disabled={coverage.embeddedFeedback === 0} />
      </div>
    </main>
  );
}