"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function CompaniesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Companies failed to load"
      description="An unexpected error occurred while rendering this page."
      onRetry={reset}
    />
  );
}
