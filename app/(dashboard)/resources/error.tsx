"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared/error-state";

export default function ResourcesError({
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
      title="Resources failed to load"
      description={error.message || "An unexpected error occurred while rendering this page."}
      onRetry={reset}
    />
  );
}
