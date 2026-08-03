import Link from "next/link";
import type { Metadata } from "next";

import { requireCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Access denied",
  description: "Your LOOP workspace role does not permit this action.",
};

export default async function ForbiddenPage() {
  const user = await requireCurrentUser();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-3xl place-items-center px-5 py-12 sm:px-8">
      <section className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-50 text-2xl font-black text-amber-700 dark:bg-amber-950 dark:text-amber-400"
        >
          403
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-loop-600 dark:text-loop-400">
          Access denied
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-loop-900 dark:text-white">
          Your role cannot open this page.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
          You are signed in as {user.role} in {user.workspace.name}. Ask a workspace administrator
          when your responsibilities require additional access.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}