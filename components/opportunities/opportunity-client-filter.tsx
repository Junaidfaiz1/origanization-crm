"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ClientOption = {
  id: string;
  company: { name: string };
};

export function OpportunityClientFilter({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("clientId") ?? "";

  return (
    <select
      aria-label="Filter by client"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-56 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("clientId", event.target.value);
        } else {
          next.delete("clientId");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All clients</option>
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.company.name}
        </option>
      ))}
    </select>
  );
}
