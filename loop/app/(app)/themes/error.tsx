"use client";

import { RouteErrorState } from "@/components/app/route-error-state";

export default function ThemesError({
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
      eyebrow="Themes unavailable"
      title="Theme clusters could not be loaded."
      description="LOOP could not read the current workspace theme catalog. No feedback or theme assignment was changed."
    />
  );
}