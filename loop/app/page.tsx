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
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"/>
    
    {/* Logo */}
    <Link
      href="/"
      className="flex items-center gap-3"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loop-900 text-lg font-black text-white">
        L
      </div>

      <div>
        <h1 className="text-lg font-extrabold tracking-widest text-loop-900">
          LOOP
        </h1>
        <p className="text-xs text-slate-500">
          AI Feedback Intelligence
        </p>
      </div>
    </Link>

    {/* Navigation */}
    <nav className="hidden items-center gap-8 md:flex">
      <Link
        href="/"
        className="text-sm font-medium text-slate-700 transition hover:text-loop-900"
      >
        Home
      </Link>

      <Link
        href="/dashboard"
        className="text-sm font-medium text-slate-700 transition hover:text-loop-900"
      >
        Dashboard
      </Link>

      <Link
        href="/profile"
        className="text-sm font-medium text-slate-700 transition hover:text-loop-900"
      >
        Profile
      </Link>

      

      <a
        href="#about"
        className="text-sm font-medium text-slate-700 transition hover:text-loop-900"
      >
        About
      </a>
    </nav>

    {/* Right Side */}
    <div className="flex items-center gap-3">
      {session?.user ? (
        <>
          <span className="hidden text-sm font-medium text-slate-600 lg:block">
            {session.user.name}
          </span>

          <Link
            href="/dashboard"
            className="rounded-xl bg-loop-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-loop-800"
          >
            Dashboard
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Sign In
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