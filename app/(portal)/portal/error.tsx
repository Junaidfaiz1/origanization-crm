"use client";

import { ErrorState } from "@/components/shared/error-state";

export default function PortalError() {
  return (
    <ErrorState
      title="Something went wrong"
      description="We couldn’t load the client portal. Refresh and try again."
    />
  );
}
