import type { Metadata } from "next";

import { FeedbackWorkspace } from "@/components/feedback/feedback-workspace";
import { requirePagePermission } from "@/lib/authorization";
import { feedbackListQuerySchema } from "@/lib/feedback-validation";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import { listWorkspaceFeedback } from "@/services/feedback-service";

export const metadata: Metadata = {
  title: "Feedback inbox",
  description:
    "Search, paginate, and triage customer feedback inside the active LOOP workspace.",
};

export const dynamic = "force-dynamic";

type SearchParams = {
  page?: string | string[];
  search?: string | string[];
};

type InboxPageProps = {
  searchParams: Promise<SearchParams>;
};

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InboxPage({
  searchParams,
}: InboxPageProps) {
  const params = await searchParams;

  const user = await requirePagePermission(PERMISSIONS.FEEDBACK_READ);
  const canCreate = hasPermission(user.role, PERMISSIONS.FEEDBACK_CREATE);
  const canUpdate = hasPermission(user.role, PERMISSIONS.FEEDBACK_UPDATE);

  const parsedQuery = feedbackListQuerySchema.safeParse({
    page: firstSearchParam(params.page),
    pageSize: 10,
    search: firstSearchParam(params.search) ?? "",
    sortOrder: "desc",
  });

  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        page: 1,
        pageSize: 10,
        search: "",
        sortOrder: "desc" as const,
      };

  const initialPage = await listWorkspaceFeedback(
    user.workspaceId,
    query,
  );

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 border-b border-slate-200 pb-8 dark:border-slate-800">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600 dark:text-loop-400">
          Core application · Day 8
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900 dark:text-white">
          Feedback inbox
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Search the exact language customers used, move through tenant-scoped
          server pages, and advance records through NEW → REVIEWED → ACTIONED
          inside the isolated {user.workspace.name} workspace.
        </p>
      </div>

      <FeedbackWorkspace
        initialPage={initialPage}
        canCreate={canCreate}
        canUpdate={canUpdate}
      />
    </main>
  );
}