import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { InvitationAcceptForm } from "@/components/auth/invitation-accept-form";
import { auth } from "@/lib/auth";
import { invitationTokenSchema } from "@/lib/member-validation";
import { getInvitationSummary } from "@/services/member-service";

export const metadata: Metadata = {
  title: "Workspace invitation",
  description: "Accept a secure invitation to a LOOP workspace.",
};

export const dynamic = "force-dynamic";

type InvitationPageProps = {
  params: {
    token: string;
  };
};

function invitationMessage(state: "EXPIRED" | "REVOKED" | "ACCEPTED" | "NOT_FOUND") {
  switch (state) {
    case "EXPIRED":
      return {
        title: "This invitation expired",
        description: "Ask a workspace administrator to create a new invitation link.",
      };
    case "REVOKED":
      return {
        title: "This invitation was revoked",
        description: "A workspace administrator cancelled this invitation.",
      };
    case "ACCEPTED":
      return {
        title: "This invitation was already used",
        description: "Sign in with the account that accepted the invitation.",
      };
    case "NOT_FOUND":
      return {
        title: "Invitation not found",
        description: "The link is invalid or no longer exists.",
      };
  }
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const parsedToken = invitationTokenSchema.safeParse(params.token);
  const invitation = parsedToken.success
    ? await getInvitationSummary(parsedToken.data)
    : { state: "NOT_FOUND" as const };

  if (invitation.state !== "ACTIVE") {
    const content = invitationMessage(invitation.state);

    return (
      <AuthShell
        eyebrow="Workspace invitation"
        title={content.title}
        description={content.description}
      >
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
        >
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Workspace invitation"
      title={`Join ${invitation.workspaceName}`}
      description="Create your account to accept this single-use invitation. Your permissions are determined by the assigned workspace role."
    >
      <InvitationAcceptForm
        token={params.token}
        email={invitation.email}
        role={invitation.role}
        workspaceName={invitation.workspaceName}
      />
    </AuthShell>
  );
}