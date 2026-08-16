"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function DashboardError({
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
      eyebrow="Dashboard unavailable"
      title="Dashboard analytics could not load."
      description="LOOP could not read the current workspace analytics. Your data has not been changed."
      returnHref="/inbox"
      returnLabel="Open inbox"
    />
  );
}