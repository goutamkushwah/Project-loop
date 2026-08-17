import Link from "next/link";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

const CHANNELS = ["Support tickets", "App-store reviews", "NPS / CSAT", "Sales call notes", "Social mentions"];

const RAW_NOTES = [
  { channel: "SUPPORT", text: "Onboarding took forever, couldn't find how to invite my team.", rotate: "-rotate-3" },
  { channel: "APP STORE", text: "Dashboard is fast now. Huge improvement over last version.", rotate: "rotate-2" },
  { channel: "SALES CALL", text: "Prospect wants SSO before signing. Third time this month.", rotate: "-rotate-1" },
  { channel: "NPS", text: "Does the job, but mobile experience needs real work.", rotate: "rotate-3" },
];

const RANKED = [
  { theme: "SSO for enterprise", count: "43", delta: "+60%" },
  { theme: "Mobile navigation friction", count: "27", delta: "+22%" },
  { theme: "Onboarding invite flow", count: "19", delta: "+8%" },
];

const STATS = [
  { value: "5", label: "feedback channels unified" },
  { value: "<2s", label: "to classify a new item" },
  { value: "100%", label: "answers cited, never invented" },
];

const FEATURES = [
  {
    title: "Auto-classification",
    body: "Every item is tagged with sentiment, theme, and feature area the moment it lands. No manual triage.",
    icon: TagIcon,
  },
  {
    title: "Theme clustering & trends",
    body: "Similar feedback groups itself into named themes, and you see exactly which ones are spiking this week.",
    icon: TrendIcon,
  },
  {
    title: "Ask LOOP",
    body: "Ask a plain-English question. Get an answer retrieved and cited from real feedback, never invented.",
    icon: ChatIcon,
  },
  {
    title: "Voice-of-Customer report",
    body: "One click turns a week of scattered notes into a digest you could forward to leadership as-is.",
    icon: DocIcon,
  },
];

const PIPELINE = [
  { step: "Embed", detail: "Every feedback item is embedded on ingest and stored as a vector." },
  { step: "Retrieve", detail: "Your question is embedded too, and matched against the closest feedback." },
  { step: "Answer", detail: "Claude answers only from what was retrieved, and shows you the receipts." },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <main className={`${display.variable} ${mono.variable} min-h-screen bg-slate-50`}>
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
              <p className="text-xs text-slate-500">
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
      <section className="relative overflow-hidden">
        {/* Soft gradient backdrop — signature element lives inside, so this stays quiet */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-loop-900/[0.07] via-amber-200/20 to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000_0,#0000_calc(100%-1px),#e2e8f0_100%),linear-gradient(to_bottom,#0000_0,#0000_calc(100%-1px),#e2e8f0_100%)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-20 pt-20 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-loop-900/15 bg-white/80 px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.15em] text-loop-900 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              AI customer-feedback intelligence
            </span>
<h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold leading-[1.15] tracking-tight text-loop-900 sm:text-4xl">
  Turn scattered feedback into a ranked, evidence-backed to-do list.
</h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Support tickets, reviews, surveys, and call notes pile up faster than anyone can read them.
              LOOP reads all of it, so you know exactly what to build next, and why.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href={session?.user ? "/dashboard" : "/signup"}
                className="rounded-lg bg-loop-900 px-6 py-3 font-semibold text-white shadow-lg shadow-loop-900/20 transition hover:-translate-y-0.5 hover:bg-loop-800 hover:shadow-xl hover:shadow-loop-900/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                {session?.user ? "Go to Dashboard" : "Get Started"}
              </Link>

              <Link
                href="#pipeline"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Signature visual: chaos -> ranked list */}
          <div className="relative mx-auto mt-20 grid max-w-5xl grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            {/* Raw notes */}
            <div className="relative grid grid-cols-2 gap-3">
              {RAW_NOTES.map((n) => (
                <div
                  key={n.text}
                  className={`${n.rotate} rounded-lg border border-slate-200 bg-white p-3 shadow-md shadow-slate-200/60 transition-transform hover:rotate-0 hover:shadow-lg motion-reduce:transition-none`}
                >
                  <span className="font-[family-name:var(--font-mono)] text-[10px] font-medium tracking-wide text-slate-400">
                    {n.channel}
                  </span>
                  <p className="mt-1.5 text-xs leading-snug text-slate-700">{n.text}</p>
                </div>
              ))}
            </div>

            {/* Flow connector */}
            <div className="hidden h-full flex-col items-center justify-center md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-loop-900/20 bg-white shadow-sm">
                <ArrowIcon />
              </div>
              <div className="mt-2 h-16 w-px bg-gradient-to-b from-loop-900/30 to-transparent" />
            </div>

            {/* Ranked output */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
              <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Ranked this week
              </span>
              <ul className="mt-3 space-y-2.5">
                {RANKED.map((r, i) => (
                  <li key={r.theme} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      <span className="font-[family-name:var(--font-mono)] text-xs font-medium text-slate-400">0{i + 1}</span>
                      <span className="text-sm font-medium text-slate-800">{r.theme}</span>
                    </div>
                    <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs">
                      <span className="text-slate-500">{r.count}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">{r.delta}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] font-medium text-teal-600">
                <CheckIcon />
                grounded in cited feedback
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-20 grid max-w-3xl grid-cols-3 gap-6 border-t border-slate-200 pt-10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-[family-name:var(--font-mono)] text-3xl font-bold text-loop-900">{s.value}</div>
                <div className="mt-1 text-xs leading-snug text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM STRIP */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 text-sm text-slate-500">
          <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-widest text-slate-400">
            Too many doors at once
          </span>
          {CHANNELS.map((c) => (
            <span key={c} className="text-slate-600">{c}</span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-loop-900 sm:text-4xl">
            Four things LOOP actually does.
          </h2>
          <p className="mt-3 text-slate-600">Not cosmetic AI. Each one requires real understanding of your feedback to work.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-loop-900/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-loop-900/[0.06] text-loop-900 transition group-hover:bg-loop-900 group-hover:text-white">
                <f.icon />
              </div>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-lg font-bold text-loop-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE (real sequence, so numbered) */}
      <section id="pipeline" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-loop-900 sm:text-4xl">
              Ask LOOP never invents an answer.
            </h2>
            <p className="mt-3 text-slate-600">
              Every question runs the same three-step pipeline, retrieve before answer, so nothing gets made up.
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl">
            {/* connecting line behind the steps */}
            <div className="absolute left-0 right-0 top-[27px] hidden h-px bg-slate-200 md:block" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PIPELINE.map((p, i) => (
                <div key={p.step} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-loop-900 font-[family-name:var(--font-mono)] text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-loop-900">{p.step}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto mt-8 flex max-w-5xl items-center gap-2 font-[family-name:var(--font-mono)] text-xs font-medium text-teal-600">
            <CheckIcon />
            if the answer isn't in the data, LOOP says so instead of guessing
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white to-slate-50" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="mx-auto max-w-xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-loop-900 sm:text-4xl">
            Stop deciding on gut feel and the loudest voice in the room.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={session?.user ? "/dashboard" : "/signup"}
              className="rounded-lg bg-loop-900 px-6 py-3 font-semibold text-white shadow-lg shadow-loop-900/20 transition hover:-translate-y-0.5 hover:bg-loop-800 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {session?.user ? "Go to Dashboard" : "Create your workspace"}
            </Link>

            {!session?.user && (
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-xs text-slate-500 md:flex-row">
          <div className="flex items-center gap-2 font-semibold text-loop-900">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-loop-900 text-[11px] font-bold text-white">
              L
            </div>
            <span className="font-[family-name:var(--font-mono)]">LOOP</span>
          </div>
          <span>Close the loop on customer feedback.</span>
        </div>
      </footer>
    </main>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 17 9 11l4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" className="text-loop-900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}