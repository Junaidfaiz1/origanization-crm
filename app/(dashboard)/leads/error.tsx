"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function LeadsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Leads failed to load"
      description="An unexpected error occurred while rendering this page."
      onRetry={reset}
    />
  );
}
