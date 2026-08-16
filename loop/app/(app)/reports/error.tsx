"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function ReportsError({
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
      eyebrow="Reports unavailable"
      title="LOOP could not load saved reports."
      description="Retry the request. No Voice-of-Customer report was created, changed, shared, or deleted by this failure."
    />
  );
}