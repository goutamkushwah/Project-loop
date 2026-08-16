"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function InboxError({
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
      eyebrow="Feedback unavailable"
      title="Feedback could not be opened."
      description="The workspace feedback view is temporarily unavailable. Retry the server request or return to the dashboard."
    />
  );
}