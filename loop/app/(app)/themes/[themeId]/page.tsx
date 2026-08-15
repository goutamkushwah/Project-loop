import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ThemeFeedbackList } from "@/components/themes/theme-feedback-list";
import { requirePagePermission } from "@/lib/authorization";
import { feedbackListQuerySchema } from "@/lib/feedback-validation";
import { PERMISSIONS } from "@/lib/rbac";
import { themeIdSchema } from "@/lib/theme-validation";
import { listWorkspaceThemeFeedback, ThemeServiceError } from "@/services/theme-service";

type ThemeDetailPageProps = {
  params: Promise<{
    themeId: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params }: ThemeDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;

  const parsedThemeId = themeIdSchema.safeParse(resolvedParams.themeId);

  return {
    title: parsedThemeId.success ? "Theme feedback" : "Theme not found",
    description: "Drill into the customer feedback assigned to a LOOP theme cluster.",
  };
}

export const dynamic = "force-dynamic";

export default async function ThemeDetailPage({ params, searchParams }: ThemeDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const user = await requirePagePermission(PERMISSIONS.THEMES_READ);

  const parsedThemeId = themeIdSchema.safeParse(resolvedParams.themeId);

  if (!parsedThemeId.success) {
    notFound();
  }

  const parsedQuery = feedbackListQuerySchema.safeParse({
    page: firstValue(resolvedSearchParams?.page),
    pageSize: 10,
    search: firstValue(resolvedSearchParams?.search) ?? "",
    sortOrder: "desc",
    themeId: parsedThemeId.data,
  });
  const query = parsedQuery.success
    ? parsedQuery.data
    : {
        page: 1,
        pageSize: 10,
        search: "",
        channel: undefined,
        sentiment: undefined,
        themeId: parsedThemeId.data,
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        sortOrder: "desc" as const,
      };
  const { themeId: _themeId, ...feedbackQuery } = query;

  try {
    const result = await listWorkspaceThemeFeedback(
      user.workspaceId,
      parsedThemeId.data,
      feedbackQuery,
    );

    return (
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="border-b border-slate-200 pb-8">
          <Link
            href="/themes"
            className="text-sm font-bold text-loop-700 underline decoration-loop-300 underline-offset-4 hover:text-loop-900"
          >
            ← Back to themes
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full"
                  style={{ backgroundColor: result.theme.color }}
                />
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
                  Theme drill-down
                </p>
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
                {result.theme.name}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {result.theme.description}
              </p>
            </div>

            <div className="rounded-2xl bg-loop-50 px-5 py-4 text-center ring-1 ring-inset ring-loop-100">
              <p className="text-3xl font-black text-loop-900">
                {result.theme.feedbackCount.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-loop-700">
                feedback items
              </p>
            </div>
          </div>
        </div>

        {!parsedQuery.success ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900"
          >
            The requested feedback query was invalid, so LOOP restored the default theme drill-down.
          </div>
        ) : null}

        <div className="mt-8">
          <ThemeFeedbackList theme={result.theme} page={result.feedback} />
        </div>
      </main>
    );
  } catch (error: unknown) {
    if (error instanceof ThemeServiceError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
