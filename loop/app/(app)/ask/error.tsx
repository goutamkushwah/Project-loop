"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function AskLoopError({
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
      eyebrow="Ask LOOP unavailable"
      title="Ask LOOP could not be loaded."
      description="LOOP could not read the workspace semantic-index state. No feedback or embeddings were changed."
      returnHref="/dashboard"
      returnLabel="Return to dashboard"
    />
  );
}