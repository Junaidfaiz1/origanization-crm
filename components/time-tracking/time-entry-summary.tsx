"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatDuration } from "@/modules/time-tracking/rules";

type TimeEntrySummary = {
  totalEntries: number;
  runningCount: number;
  totalSeconds: number;
  billableSeconds: number;
  nonBillableSeconds: number;
};

export function TimeEntrySummaryCards({ summary }: { summary: TimeEntrySummary }) {
  const router = useRouter();
  const params = useSearchParams();
  const runningOnly = params.get("runningOnly") === "true";

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Logged hours</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          {formatDuration(summary.totalSeconds)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{summary.totalEntries} entries</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Billable</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          {formatDuration(summary.billableSeconds)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Non-billable</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          {formatDuration(summary.nonBillableSeconds)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          const next = new URLSearchParams(params.toString());
          if (runningOnly) {
            next.delete("runningOnly");
          } else {
            next.set("runningOnly", "true");
          }
          next.delete("cursor");
          router.push(`?${next.toString()}`);
        }}
        className={`rounded-xl border p-4 text-left transition-colors ${
          runningOnly
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:bg-muted/40"
        }`}
      >
        <p className="text-xs text-muted-foreground">Running timers</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{summary.runningCount}</p>
      </button>
    </div>
  );
}

export function TimeEntryProjectFilter({
  projects,
}: {
  projects: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("projectId") ?? "";

  return (
    <select
      aria-label="Filter by project"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-56 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("projectId", event.target.value);
        } else {
          next.delete("projectId");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All projects</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}

export function TimeEntryBillableFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("billable") ?? "";

  return (
    <select
      aria-label="Filter by billable"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-40 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("billable", event.target.value);
        } else {
          next.delete("billable");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All entries</option>
      <option value="true">Billable</option>
      <option value="false">Non-billable</option>
    </select>
  );
}

export function TimeEntryUserFilter({
  users,
}: {
  users: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("userId") ?? "";

  if (users.length === 0) {
    return null;
  }

  return (
    <select
      aria-label="Filter by person"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("userId", event.target.value);
        } else {
          next.delete("userId");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All people</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name}
        </option>
      ))}
    </select>
  );
}
