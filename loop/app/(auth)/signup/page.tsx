import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { auth } from "@/lib/auth";
import { sanitizeCallbackUrl } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Create workspace",
  description: "Create a secure LOOP account and company workspace.",
};

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  const rawCallbackUrl = Array.isArray(params?.callbackUrl)
    ? params.callbackUrl[0]
    : params?.callbackUrl;

  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl);

  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <AuthShell
      eyebrow="Start securely"
      title="Create your LOOP workspace"
      description="The account creator becomes the workspace administrator. Your company data remains isolated from every other workspace."
    >
      <SignupForm callbackUrl={callbackUrl} />
    </AuthShell>
  );
}