"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function AppError({
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
      eyebrow="Application error"
      title="LOOP could not load this page."
      description="Retry the request. Your workspace data has not been changed by this page-rendering failure."
      returnHref="/"
      returnLabel="LOOP home"
      mainId="main-content"
    />
  );
}