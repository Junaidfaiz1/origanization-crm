"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function InvoicesError() {
  return (
    <ErrorState
      title="Something went wrong"
      description="We couldn’t load invoices. Refresh the page or try again later."
    />
  );
}
