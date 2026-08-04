import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import { sanitizeCallbackUrl } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in securely to your LOOP workspace.",
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
    registered?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  const rawCallbackUrl = Array.isArray(params?.callbackUrl)
    ? params.callbackUrl[0]
    : params?.callbackUrl;

  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl);

  // const session = await auth();

  // if (session?.user) {
  //   redirect("/dashboard");
  // }

  const registered = Array.isArray(params?.registered)
    ? params.registered[0]
    : params?.registered;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to LOOP"
      description="Use your workspace account to continue to the protected application."
    >
      {registered === "1" ? (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Your workspace was created. Sign in to continue.
        </div>
      ) : null}

      <LoginForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}