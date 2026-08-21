"use client";

import { useRouter, useSearchParams } from "next/navigation";

type CompanyOption = {
  id: string;
  name: string;
};

export function CompanyFilter({ companies }: { companies: CompanyOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("companyId") ?? "";

  return (
    <select
      aria-label="Filter by company"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-56 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("companyId", event.target.value);
        } else {
          next.delete("companyId");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All companies</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  );
}
