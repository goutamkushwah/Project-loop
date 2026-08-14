import type { Metadata } from "next";

import { requirePagePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";

import { AskLoopChat } from "./ask-loop-chat";

export const metadata: Metadata = {
  title: "Ask LOOP",
  description: "Semantic search and chat over your workspace's customer feedback.",
};

export const dynamic = "force-dynamic";

export default async function AskLoopPage() {
  const user = await requirePagePermission(PERMISSIONS.DASHBOARD_READ);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
          Week 3 AI features
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">Ask LOOP</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Ask questions about feedback in the {user.workspace.name} workspace, in plain English.
        </p>
      </div>

      <AskLoopChat />
    </main>
  );
}