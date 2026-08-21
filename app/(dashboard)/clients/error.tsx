"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ClientsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="Clients failed to load"
      description="An unexpected error occurred while rendering this page."
      onRetry={reset}
    />
  );
}
