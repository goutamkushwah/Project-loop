import type { Metadata } from "next";

import { FeedbackWorkspace } from "@/components/feedback/feedback-workspace";
import { requirePagePermission } from "@/lib/authorization";
import { feedbackListQuerySchema } from "@/lib/feedback-validation";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";
import {
  listWorkspaceFeedback,
  listWorkspaceThemeOptions,
} from "@/services/feedback-service";

export const metadata: Metadata = {
  title: "Feedback inbox",
  description:
    "Search, filter, paginate, and triage customer feedback inside the active LOOP workspace.",
};

export const dynamic = "force-dynamic";

type InboxPageProps = {
  searchParams?: {
    page?: string | string[];
    search?: string | string[];
    channel?: string | string[];
    sentiment?: string | string[];
    themeId?: string | string[];
    status?: string | string[];
    dateFrom?: string | string[];
    dateTo?: string | string[];
  };
};

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const user = await requirePagePermission(PERMISSIONS.FEEDBACK_READ);
  const canCreate = hasPermission(user.role, PERMISSIONS.FEEDBACK_CREATE);
  const canUpdate = hasPermission(user.role, PERMISSIONS.FEEDBACK_UPDATE);
  const parsedQuery = feedbackListQuerySchema.safeParse({
    page: firstSearchParam(searchParams?.page),
    pageSize: 10,
    search: firstSearchParam(searchParams?.search) ?? "",
    channel: firstSearchParam(searchParams?.channel),
    sentiment: firstSearchParam(searchParams?.sentiment),
    themeId: firstSearchParam(searchParams?.themeId),
    status: firstSearchParam(searchParams?.status),
    dateFrom: firstSearchParam(searchParams?.dateFrom),
    dateTo: firstSearchParam(searchParams?.dateTo),
    sortOrder: "desc",
  });
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        page: 1,
        pageSize: 10,
        search: "",
        channel: undefined,
        sentiment: undefined,
        themeId: undefined,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        sortOrder: "desc" as const,
      };
  const [initialPage, themeOptions] = await Promise.all([
    listWorkspaceFeedback(user.workspaceId, query),
    listWorkspaceThemeOptions(user.workspaceId),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 border-b border-slate-200 pb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
          AI integration · Day 13
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
          Feedback inbox
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Search and triage feedback while Gemini classification stores sentiment and theme assignments.
          Day 13 adds a dedicated theme-cluster view so every assigned theme can be explored back to the
          tenant-scoped feedback that supports it inside {user.workspace.name}.
        </p>
      </div>

      <FeedbackWorkspace
        initialPage={initialPage}
        themeOptions={themeOptions}
        canCreate={canCreate}
        canUpdate={canUpdate}
      />
    </main>
  );
}