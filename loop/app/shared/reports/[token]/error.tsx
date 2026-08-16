"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function SharedReportError({
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
      eyebrow="Shared report unavailable"
      title="This report could not be loaded right now."
      description="Retry the public report request. If the share link was revoked or rotated, request a new link from the workspace owner."
      returnHref="/"
      returnLabel="LOOP home"
      mainId="main-content"
    />
  );
}