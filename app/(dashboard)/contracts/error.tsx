"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function ContractsError() {
  return (
    <ErrorState
      title="Something went wrong"
      description="We couldn’t load contracts. Refresh the page or try again later."
    />
  );
}
