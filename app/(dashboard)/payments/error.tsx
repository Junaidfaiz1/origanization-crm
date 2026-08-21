"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PaymentsError() {
  return (
    <ErrorState
      title="Something went wrong"
      description="We couldn’t load payments. Refresh the page or try again later."
    />
  );
}
