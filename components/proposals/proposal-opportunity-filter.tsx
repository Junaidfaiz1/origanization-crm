"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ProposalOption = {
  id: string;
  name: string;
};

export function ProposalOpportunityFilter({
  opportunities,
}: {
  opportunities: ProposalOption[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("opportunityId") ?? "";

  return (
    <select
      aria-label="Filter by opportunity"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-56 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("opportunityId", event.target.value);
        } else {
          next.delete("opportunityId");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All opportunities</option>
      {opportunities.map((opportunity) => (
        <option key={opportunity.id} value={opportunity.id}>
          {opportunity.name}
        </option>
      ))}
    </select>
  );
}
