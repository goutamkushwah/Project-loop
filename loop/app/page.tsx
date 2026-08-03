import Link from "next/link";

import { auth } from "@/lib/auth";
<<<<<<< HEAD
=======
import ThemeToggle from "@/components/theme/theme-toggle";
>>>>>>> c87dbf9f41788c6279f81b001d740f99e1a6c0b9

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loop-900 text-lg font-bold text-white">
              L
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wider text-loop-900">
                LOOP
              </h1>
<<<<<<< HEAD
              <p className="text-xs text-slate-500">
=======

              <p className="text-xs text-slate-500 dark:text-slate-400">
>>>>>>> c87dbf9f41788c6279f81b001d740f99e1a6c0b9
                Customer Feedback Platform
              </p>
            </div>
          </Link>


          {/* Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-slate-700 hover:text-loop-900"
            >
              Home
            </Link>

            <Link
              href="/about"
              className="text-sm font-medium text-slate-700 hover:text-loop-900"
            >
              About
            </Link>


            {session?.user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-700 hover:text-loop-900"
              >
                Dashboard
              </Link>
            )}
          </nav>


          {/* Actions */}
          <div className="flex items-center gap-3">
<<<<<<< HEAD
=======

            <ThemeToggle />

>>>>>>> c87dbf9f41788c6279f81b001d740f99e1a6c0b9
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-loop-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loop-800"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-700 hover:text-loop-900"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="rounded-lg bg-loop-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-loop-800"
                >
                  Sign Up
                </Link>
              </>
            )}

          </div>
        </div>
      </header>


      {/* Hero */}
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col items-center justify-center px-6 text-center">
<<<<<<< HEAD
        <h1 className="text-5xl font-extrabold text-loop-900 sm:text-6xl">
          Project LOOP
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600">
=======

        <h1 className="text-5xl font-extrabold text-loop-900 dark:text-white sm:text-6xl">
          Project LOOP
        </h1>


        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
>>>>>>> c87dbf9f41788c6279f81b001d740f99e1a6c0b9
          AI-powered customer feedback intelligence platform that helps teams
          collect, manage, and analyze customer feedback in one place.
        </p>


        <div className="mt-10 flex flex-wrap justify-center gap-4">

          <Link
            href={session?.user ? "/dashboard" : "/signup"}
            className="rounded-lg bg-loop-900 px-6 py-3 font-semibold text-white transition hover:bg-loop-800"
          >
            {session?.user ? "Go to Dashboard" : "Get Started"}
          </Link>


          <Link
            href="/about"
<<<<<<< HEAD
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
=======
            className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
>>>>>>> c87dbf9f41788c6279f81b001d740f99e1a6c0b9
          >
            Learn More
          </Link>

        </div>

      </section>

    </main>
  );
}