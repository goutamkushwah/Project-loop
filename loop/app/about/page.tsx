import Link from "next/link";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

const FEATURES = [
  {
    title: "Analytics",
    body: "Interactive dashboards give you real-time insight into volume, sentiment, and satisfaction as feedback comes in.",
    icon: ChartIcon,
  },
  {
    title: "AI intelligence",
    body: "Sentiment is classified, themes are clustered, and emerging trends surface automatically, no manual tagging.",
    icon: SparkIcon,
  },
  {
    title: "Secure workspace",
    body: "Role-based access and fully isolated workspaces mean every team's data stays private, always.",
    icon: ShieldIcon,
  },
];

const PIPELINE = ["Ingest", "Classify", "Cluster", "Answer", "Report"];

const STACK = ["Next.js 14", "TypeScript", "PostgreSQL", "Prisma", "pgvector", "Claude AI"];

export default async function AboutPage() {
  const session = await auth();

  return (
    <main className={`${display.variable} ${mono.variable} relative isolate min-h-screen overflow-hidden bg-slate-50`}>
      {/* Background */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-loop-100 via-violet-50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#0000_0,#0000_calc(100%-1px),#e2e8f0_100%),linear-gradient(to_bottom,#0000_0,#0000_calc(100%-1px),#e2e8f0_100%)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_0%,black,transparent)]"
      />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loop-900 text-lg font-black text-white shadow-panel">
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

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-slate-700 hover:text-loop-900"
            >
              Home
            </Link>

            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-loop-900"
            >
              Dashboard
            </Link>

           

            <Link
              href="/about"
              className="text-sm font-semibold text-loop-900"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <span className="hidden lg:block text-sm text-slate-600">
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
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-loop-900/15 bg-white/80 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.15em] text-loop-900 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          About the platform
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] tracking-tight text-loop-900 sm:text-5xl">
          Every piece of feedback,
          <br className="hidden sm:block" /> read, ranked, and understood.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Project LOOP is an AI-powered customer feedback intelligence platform that helps organizations
          collect, analyze, and visualize customer feedback — so teams understand sentiment, catch trends
          early, and decide with evidence instead of gut feel.
        </p>
      </section>

      {/* Pipeline strip */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PIPELINE.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-loop-900 shadow-sm">
                {step}
              </span>
              {i < PIPELINE.length - 1 && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-slate-300">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:border-loop-900/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-loop-900/[0.06] text-loop-900 transition group-hover:bg-loop-900 group-hover:text-white">
              <f.icon />
            </div>
            <h2 className="mb-2 mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-loop-900">
              {f.title}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-loop-900 p-10 text-white sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
          />
          <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.15em] text-amber-300">
            Our mission
          </span>
          <h2 className="mb-6 mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Turn feedback into decisions, not backlog.
          </h2>

          <p className="max-w-3xl text-lg leading-8 text-slate-200">
            Our mission is to transform customer feedback into meaningful insights that help organizations
            improve products, services, and customer experiences. With AI-powered analytics, Project LOOP
            makes decision-making faster, smarter, and more reliable.
          </p>
        </div>
      </section>

      
    </main>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}