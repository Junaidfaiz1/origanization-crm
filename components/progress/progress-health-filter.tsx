"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROGRESS_HEALTH } from "@/modules/progress/rules";

export function ProgressHealthFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("health") ?? "";

  return (
    <select
      aria-label="Filter by health"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("health", event.target.value);
        } else {
          next.delete("health");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All health</option>
      {PROGRESS_HEALTH.map((health) => (
        <option key={health} value={health}>
          {health.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
