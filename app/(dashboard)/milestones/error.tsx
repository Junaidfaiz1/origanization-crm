"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function MilestonesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Milestones failed to load"
      description={error.message || "An unexpected error occurred while rendering this page."}
      onRetry={reset}
    />
  );
}
