"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { PROJECT_STATUSES } from "@/modules/projects/rules";

type StatusSummary = {
  total: number;
  activeCount: number;
  stages: Array<{ status: string; count: number }>;
};

export function ProjectStatusSummary({ summary }: { summary: StatusSummary }) {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") ?? "";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active projects</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.activeCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.total} total</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Delivery pipeline</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">
            {summary.stages
              .filter((stage) => ["IN_PROGRESS", "IN_REVIEW", "BIDDING"].includes(stage.status))
              .reduce((sum, stage) => sum + stage.count, 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">In progress, review, or bidding</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-3">
          {summary.stages.map((stage) => {
            const active = currentStatus === stage.status;
            return (
              <button
                key={stage.status}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params.toString());
                  if (active) {
                    next.delete("status");
                  } else {
                    next.set("status", stage.status);
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
                  <StatusBadge status={stage.status} />
                </div>
                <p className="text-lg font-semibold">{stage.count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {currentStatus ? (
        <p className="text-sm text-muted-foreground">
          Filtered to status{" "}
          <span className="font-medium">
            {currentStatus.replaceAll("_", " ").toLowerCase()}
          </span>
          {" · "}
          <Link href="/projects" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function ProjectStatusFilter() {
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
      {PROJECT_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
