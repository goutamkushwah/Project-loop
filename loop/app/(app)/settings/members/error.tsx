"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function WorkspaceMembersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      eyebrow="Workspace administration unavailable"
      title="Members and invitations could not be loaded."
      description="LOOP could not read the current workspace membership state. No member, role, or invitation was changed."
    />
  );
}