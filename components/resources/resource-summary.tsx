"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { AVAILABILITY_STATUSES, RESOURCE_TYPES } from "@/modules/resources/rules";

type ResourceSummary = {
  total: number;
  employees: number;
  freelancers: number;
  availability: Array<{ status: string; count: number }>;
};

export function ResourceSummaryCards({ summary }: { summary: ResourceSummary }) {
  const router = useRouter();
  const params = useSearchParams();
  const currentAvailability = params.get("availabilityStatus") ?? "";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total resources</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Employees</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.employees}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Freelancers</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.freelancers}</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-3">
          {summary.availability.map((item) => {
            const active = currentAvailability === item.status;
            return (
              <button
                key={item.status}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params.toString());
                  if (active) {
                    next.delete("availabilityStatus");
                  } else {
                    next.set("availabilityStatus", item.status);
                  }
                  next.delete("cursor");
                  router.push(`?${next.toString()}`);
                }}
                className={`w-36 rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="mb-2">
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-lg font-semibold">{item.count}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ResourceTypeFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("type") ?? "";

  return (
    <select
      aria-label="Filter by type"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-44 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("type", event.target.value);
        } else {
          next.delete("type");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All types</option>
      {RESOURCE_TYPES.map((type) => (
        <option key={type} value={type}>
          {type.replaceAll("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}

export function ResourceAvailabilityFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("availabilityStatus") ?? "";

  return (
    <select
      aria-label="Filter by availability"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("availabilityStatus", event.target.value);
        } else {
          next.delete("availabilityStatus");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All availability</option>
      {AVAILABILITY_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}

export function ResourceSkillFilter({
  skills,
}: {
  skills: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("skillId") ?? "";

  return (
    <select
      aria-label="Filter by skill"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-44 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("skillId", event.target.value);
        } else {
          next.delete("skillId");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All skills</option>
      {skills.map((skill) => (
        <option key={skill.id} value={skill.id}>
          {skill.name}
        </option>
      ))}
    </select>
  );
}
