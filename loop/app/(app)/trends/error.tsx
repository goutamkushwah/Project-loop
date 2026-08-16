"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function TrendsError({
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
      eyebrow="Trends unavailable"
      title="Theme trends could not be loaded."
      description="LOOP could not calculate the workspace comparison. No feedback, themes, or assignments were changed."
      returnHref="/themes"
      returnLabel="Open themes"
    />
  );
}