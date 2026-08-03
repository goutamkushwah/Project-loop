import Link from "next/link";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const session = await auth();

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Background */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-loop-100 via-violet-50 to-transparent dark:from-loop-950 dark:via-slate-900 dark:to-transparent"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loop-900 text-lg font-black text-white shadow-panel">
              L
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-widest text-loop-900 dark:text-white">
                LOOP
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI Feedback Intelligence
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-slate-700 hover:text-loop-900 dark:text-slate-300 dark:hover:text-white"
            >
              Home
            </Link>

            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-loop-900 dark:text-slate-300 dark:hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/profile"
              className="text-sm font-medium text-slate-700 hover:text-loop-900 dark:text-slate-300 dark:hover:text-white"
            >
              Profile
            </Link>

            <Link
              href="/about"
              className="text-sm font-semibold text-loop-900 dark:text-white"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <span className="hidden lg:block text-sm text-slate-600 dark:text-slate-300">
                  {session.user.name ?? "User"}
                </span>

                <Link
                  href="/dashboard"
                  className="rounded-xl bg-loop-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-loop-800"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-loop-900 px-4 py-2 text-sm font-semibold text-white hover:bg-loop-800"
                >
                  Create Workspace
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="text-5xl font-black text-loop-900 dark:text-white">
          About Project LOOP
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Project LOOP is an AI-powered customer feedback intelligence platform
          that helps organizations collect, analyze, and visualize customer
          feedback. It enables businesses to understand customer sentiment,
          detect trends, and make data-driven decisions.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-8 shadow dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800">
          <h2 className="mb-4 text-2xl font-bold text-loop-900 dark:text-white">
            📊 Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Interactive dashboards provide real-time insights into customer
            feedback and satisfaction.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800">
          <h2 className="mb-4 text-2xl font-bold text-loop-900 dark:text-white">
            🤖 AI Intelligence
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Automatically classify sentiment, discover feedback themes, and
            identify emerging trends using AI.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-800">
          <h2 className="mb-4 text-2xl font-bold text-loop-900 dark:text-white">
            🔒 Secure Workspace
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Role-based authentication and isolated workspaces ensure secure team
            collaboration.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-3xl bg-loop-900 p-10 text-white dark:bg-loop-950 dark:ring-1 dark:ring-loop-800">
          <h2 className="mb-6 text-3xl font-bold">Our Mission</h2>

          <p className="text-lg leading-8 text-slate-200">
            Our mission is to transform customer feedback into meaningful
            insights that help organizations improve products, services, and
            customer experiences. With AI-powered analytics, Project LOOP makes
            decision-making faster, smarter, and more reliable.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        © {new Date().getFullYear()} Project LOOP. All rights reserved.
      </footer>
    </main>
  );
}