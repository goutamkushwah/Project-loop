import type { Metadata } from "next";

import { ClassificationLab } from "@/components/ai/classification-lab";
import { isAiConfigured } from "@/lib/ai";
import { requirePagePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { getClassificationThemeCatalog } from "@/services/ai-classification-service";

export const metadata: Metadata = {
  title: "AI Classification",
  description: "Validate LOOP's server-side Claude classification pipeline.",
};

export const dynamic = "force-dynamic";

export default async function AiClassificationPage() {
  const user = await requirePagePermission(PERMISSIONS.AI_CLASSIFY);
  const themes = await getClassificationThemeCatalog(user.workspaceId);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col gap-5 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
            Week 3 AI integration
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
            Claude classification pipeline
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Test one feedback item against the isolated {user.workspace.name} theme catalog. Claude
            runs only on the server, returns strict JSON, and must pass Zod validation before LOOP
            exposes the result.
          </p>
        </div>
        <span className="w-fit rounded-full bg-loop-100 px-4 py-2 text-sm font-bold text-loop-800">
          Preview only · no database write
        </span>
      </div>

      <div className="mt-8">
        <ClassificationLab themes={themes} configured={isAiConfigured()} />
      </div>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-7">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-600">Day 11 boundary</p>
        <h2 className="mt-2 text-xl font-black text-slate-900">
          Connectivity and validation are complete; persistence starts on Day 12.
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This page intentionally does not update feedback records, create theme assignments, or run
          classification during ingestion. Day 12 will connect this validated service to stored feedback,
          back-fill pending records, and add manual re-classification.
        </p>
      </section>
    </main>
  );
}