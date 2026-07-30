import Link from "next/link";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const foundationItems = [
  "Three server-enforced workspace roles",
  "Tenant-scoped member queries",
  "Single-use teammate invitations",
  "Role and account-status management",
  "Last-administrator protection",
] as const;

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 px-6 py-10 sm:px-10 lg:px-16">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-loop-100 via-violet-50 to-transparent"
      />

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-5 border-b border-slate-200 pb-6">
          <a
            href="#main-content"
            className="sr-only rounded-md bg-white px-3 py-2 text-sm font-semibold text-loop-800 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
          >
            Skip to content
          </a>

          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
            aria-label="LOOP home"
          >
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-loop-900 text-lg font-black text-white shadow-panel"
            >
              L
            </span>
            <span>
              <span className="block text-base font-extrabold tracking-[0.24em] text-loop-900">
                LOOP
              </span>
              <span className="block text-xs text-slate-500">Customer-feedback intelligence</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2" aria-label="Account navigation">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-loop-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Open dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-loop-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
                >
                  Create workspace
                </Link>
              </>
            )}
          </nav>
        </header>

        <section
          id="main-content"
          className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-20"
        >
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-loop-600">
              Day 4 workspaces and RBAC
            </p>
            <h1 className="max-w-4xl text-balance text-5xl font-black tracking-tight text-loop-900 sm:text-6xl lg:text-7xl">
              The right access for every teammate.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
              Administrators manage members and roles, analysts operate the feedback workflow, and
              viewers receive read-only access—all inside a strictly isolated company workspace.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                RBAC ready
              </span>
              <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                Week 1 · Foundation &amp; Data Layer
              </span>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href={session?.user ? "/dashboard" : "/signup"}
                className="rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                {session?.user ? "Continue to dashboard" : "Create your workspace"}
              </Link>
              <a
                href="/api/health"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                System health
              </a>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/90 p-7 shadow-panel backdrop-blur sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-loop-600">Workspace access checklist</p>
                <h2 className="mt-1 text-2xl font-bold text-loop-900">Tenant-safe administration</h2>
              </div>
              <span className="rounded-lg bg-loop-100 px-3 py-1 text-xs font-bold text-loop-700">
                DAY 4
              </span>
            </div>

            <ul className="mt-7 space-y-4" aria-label="Completed workspace capabilities">
              {foundationItems.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-5 shrink-0 text-emerald-600"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.293a1 1 0 0 1 .003 1.414l-7.25 7.28a1 1 0 0 1-1.42 0l-3.744-3.76a1 1 0 0 1 1.414-1.414l3.04 3.052 6.543-6.57a1 1 0 0 1 1.414-.002Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl bg-loop-900 p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-loop-300">
                Isolation by construction
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Member and invitation APIs derive workspace ownership from the authenticated server
                session. Browser-supplied workspace IDs are never trusted.
              </p>
            </div>
          </aside>
        </section>

        <footer className="border-t border-slate-200 py-6 text-sm text-slate-500">
          Build it like a product. Ship it like a professional.
        </footer>
      </div>
    </main>
  );
}