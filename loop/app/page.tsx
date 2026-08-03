import Link from "next/link";

import { auth } from "@/lib/auth";
import ThemeToggle from "@/components/theme-toggle";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loop-900 text-lg font-bold text-white">
              L
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wider text-loop-900 dark:text-white">
                LOOP
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer Feedback Platform
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-slate-700 hover:text-loop-900 dark:text-slate-300 dark:hover:text-white"
            >
              Home
            </Link>

            <Link
              href="/about"
              className="text-sm font-medium text-slate-700 hover:text-loop-900 dark:text-slate-300 dark:hover:text-white"
            >
              About
            </Link>

            {session?.user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-700 hover:text-loop-900 dark:text-slate-300 dark:hover:text-white"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-loop-900 px-4 py-2 text-sm font-semibold text-white hover:bg-loop-800"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-loop-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="rounded-lg bg-loop-900 px-4 py-2 text-sm font-semibold text-white hover:bg-loop-800"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-extrabold text-loop-900 dark:text-white sm:text-6xl">
          Project LOOP
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          AI-powered customer feedback intelligence platform that helps teams
          collect, manage, and analyze customer feedback in one place.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href={session?.user ? "/dashboard" : "/signup"}
            className="rounded-lg bg-loop-900 px-6 py-3 font-semibold text-white hover:bg-loop-800"
          >
            {session?.user ? "Go to Dashboard" : "Get Started"}
          </Link>

          <Link
            href="/about"
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Learn More
          </Link>
        </div>
      </section>
    </main>
  );
}