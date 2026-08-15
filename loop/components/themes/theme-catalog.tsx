import Link from "next/link";

import { ThemeClusterButton } from "@/components/themes/theme-cluster-button";
import type { ThemePage } from "@/types/theme";

type ThemeCatalogProps = {
  page: ThemePage;
  canCluster: boolean;
};

function buildThemePageHref(page: ThemePage, nextPage: number): string {
  const params = new URLSearchParams();

  if (nextPage > 1) {
    params.set("page", String(nextPage));
  }

  if (page.query.search) {
    params.set("search", page.query.search);
  }

  if (page.query.sortBy !== "count") {
    params.set("sortBy", page.query.sortBy);
  }

  if (page.query.sortOrder !== "desc") {
    params.set("sortOrder", page.query.sortOrder);
  }

  const query = params.toString();
  return query ? `/themes?${query}` : "/themes";
}

export function ThemeCatalog({ page, canCluster }: ThemeCatalogProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <form method="GET" action="/themes" className="grid flex-1 gap-4 sm:grid-cols-[1fr_180px_150px_auto]">
            <div>
              <label htmlFor="theme-search" className="block text-sm font-bold text-slate-800">
                Search themes
              </label>
              <input
                id="theme-search"
                name="search"
                type="search"
                defaultValue={page.query.search}
                maxLength={120}
                placeholder="Onboarding, billing, search…"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
              />
            </div>

            <div>
              <label htmlFor="theme-sort" className="block text-sm font-bold text-slate-800">
                Sort by
              </label>
              <select
                id="theme-sort"
                name="sortBy"
                defaultValue={page.query.sortBy}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
              >
                <option value="count">Feedback count</option>
                <option value="name">Theme name</option>
                <option value="createdAt">Created date</option>
              </select>
            </div>

            <div>
              <label htmlFor="theme-order" className="block text-sm font-bold text-slate-800">
                Order
              </label>
              <select
                id="theme-order"
                name="sortOrder"
                defaultValue={page.query.sortOrder}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-xl bg-loop-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Apply
              </button>
              <Link
                href="/themes"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Reset
              </Link>
            </div>
          </form>

          <div className="xl:max-w-sm">
            <ThemeClusterButton canCluster={canCluster} />
          </div>
        </div>
      </section>

      {page.items.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <span aria-hidden="true" className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-xl shadow-sm">
            ◌
          </span>
          <h2 className="mt-5 text-xl font-black text-slate-900">
            {page.query.search ? "No matching themes" : "No themes yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            {page.query.search
              ? "Try a broader theme search or clear the current query."
              : "Themes appear as Gemini classifies feedback and assigns similar items to shared workspace clusters."}
          </p>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-700">
              {page.pagination.totalItems.toLocaleString()} theme{page.pagination.totalItems === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-slate-500">
              Page {page.pagination.page} of {page.pagination.totalPages}
            </p>
          </div>

          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Workspace themes">
            {page.items.map((theme) => (
              <li key={theme.id}>
                <Link
                  href={`/themes/${theme.id}`}
                  className="group block h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-loop-300 hover:shadow-panel focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200">
                        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: theme.color }} />
                        Theme cluster
                      </span>
                      <h2 className="mt-4 text-xl font-black text-loop-900 group-hover:text-loop-700">
                        {theme.name}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-2xl bg-loop-50 px-3 py-2 text-sm font-black text-loop-800">
                      {theme.feedbackCount.toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {theme.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="font-semibold text-slate-500">
                      {theme.feedbackCount === 1 ? "1 feedback item" : `${theme.feedbackCount.toLocaleString()} feedback items`}
                    </span>
                    <span className="font-bold text-loop-700">View feedback →</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <nav className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5" aria-label="Theme pagination">
            {page.pagination.page > 1 ? (
              <Link
                href={buildThemePageHref(page, page.pagination.page - 1)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">
                Previous
              </span>
            )}

            <p className="text-sm font-semibold text-slate-600">
              Page {page.pagination.page} of {page.pagination.totalPages}
            </p>

            {page.pagination.page < page.pagination.totalPages ? (
              <Link
                href={buildThemePageHref(page, page.pagination.page + 1)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-400">
                Next
              </span>
            )}
          </nav>
        </>
      )}
    </div>
  );
}