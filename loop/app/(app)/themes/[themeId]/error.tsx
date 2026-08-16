"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function ThemeDetailError({
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
      eyebrow="Theme evidence unavailable"
      title="Theme feedback could not be loaded."
      description="LOOP could not read the supporting feedback for this theme. No feedback or theme assignment was changed."
      returnHref="/themes"
      returnLabel="Back to themes"
    />
  );
}