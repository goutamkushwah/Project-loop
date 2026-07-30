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
              Project - Loop
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-600 sm:text-xl">
              Administrators manage members and roles, analysts operate the feedback workflow, and
              viewers receive read-only access—all inside a strictly isolated company workspace.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              
             
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

          
        </section>

        
      </div>
    </main>
  );
}