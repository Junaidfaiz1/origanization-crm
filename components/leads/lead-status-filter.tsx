"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LEAD_STATUSES } from "@/modules/leads/rules";

export function LeadStatusFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("status") ?? "";

  return (
    <select
      aria-label="Filter by status"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("status", event.target.value);
        } else {
          next.delete("status");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All statuses</option>
      {LEAD_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
