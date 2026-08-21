"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type SortOption = {
  value: string;
  label: string;
};

export function SortSelect({
  options,
  param = "sort",
  label = "Sort by",
}: {
  options: SortOption[];
  param?: string;
  label?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get(param) ?? options[0]?.value ?? "";

  return (
    <select
      aria-label={label}
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value && event.target.value !== options[0]?.value) {
          next.set(param, event.target.value);
        } else {
          next.delete(param);
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
