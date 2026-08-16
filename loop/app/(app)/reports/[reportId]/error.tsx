"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function ReportDetailError({
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
      eyebrow="Report unavailable"
      title="This saved report could not be loaded."
      description="Retry the request or return to the saved report list. The persisted report snapshot has not been changed."
      returnHref="/reports"
      returnLabel="Saved reports"
    />
  );
}