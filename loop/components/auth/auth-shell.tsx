import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const productPoints = [
  "Private multi-tenant workspaces",
  "Role-aware access from the first session",
  "Evidence-backed customer intelligence",
] as const;

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-loop-900 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="absolute -right-32 -top-32 size-96 rounded-full bg-loop-600/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-20 size-[30rem] rounded-full bg-violet-400/10 blur-3xl"
        />

        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-4 focus:ring-offset-loop-900"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-white text-lg font-black text-loop-900">
            L
          </span>
          <span>
            <span className="block text-lg font-extrabold tracking-[0.24em]">LOOP</span>
            <span className="block text-xs text-loop-200">Customer-feedback intelligence</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-loop-300">
            Close the loop
          </p>
          <h2 className="mt-5 text-balance text-5xl font-black leading-tight">
            Turn scattered feedback into the next clear decision.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            LOOP gives product, support, and leadership teams one secure place to understand what
            customers are saying and why it matters.
          </p>

          <ul className="mt-10 space-y-4" aria-label="LOOP platform benefits">
            {productPoints.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                <span
                  aria-hidden="true"
                  className="grid size-6 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"
                >
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-slate-400">
          Build it like a product. Ship it like a professional.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-3 rounded-xl text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-4 lg:hidden"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-loop-900 font-black text-white">
              L
            </span>
            <span className="font-extrabold tracking-[0.2em]">LOOP</span>
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-panel sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-loop-900">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}