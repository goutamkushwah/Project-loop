import type { Metadata } from "next";

import { FeedbackWorkspace } from "@/components/feedback/feedback-workspace";

import { requirePagePermission } from "@/lib/authorization";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { listWorkspaceFeedback } from "@/services/feedback-service";


export const metadata: Metadata = {
  title: "Feedback",
  description: "Add and view customer feedback in the active LOOP workspace.",
};


export const dynamic = "force-dynamic";


export default async function InboxPage() {

  const user = await requirePagePermission(
    PERMISSIONS.FEEDBACK_READ
  );


  const canCreate = hasPermission(
    user.role,
    PERMISSIONS.FEEDBACK_CREATE
  );


  const initialPage = await listWorkspaceFeedback(
    user.workspaceId,
    {
      page:1,
      pageSize:10,
      sortOrder:"desc",
    }
  );


  return (

    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">


      <div className="mb-8 border-b border-slate-200 pb-8">


        <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
          Feedback ingestion
        </p>


        <h1 className="mt-3 text-4xl font-black text-loop-900">
          Customer Feedback
        </h1>


        <p className="mt-3 text-slate-600">
          Add feedback manually, upload CSV files, and manage workspace feedback.
        </p>


      </div>



      <FeedbackWorkspace
        initialPage={initialPage}
        canCreate={canCreate}
      />


    </main>

  );
}