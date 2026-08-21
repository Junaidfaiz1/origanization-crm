"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/modules/tasks/rules";

type StatusSummary = {
  total: number;
  openCount: number;
  stages: Array<{ status: string; count: number }>;
  priorities: { URGENT: number; HIGH: number };
};

export function TaskStatusSummary({ summary }: { summary: StatusSummary }) {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") ?? "";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Open tasks</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.openCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.total} total</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Urgent</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.priorities.URGENT}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">High priority</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.priorities.HIGH}</p>
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
          <Link href="/tasks" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function TaskStatusFilter() {
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
      {TASK_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}

export function TaskPriorityFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("priority") ?? "";

  return (
    <select
      aria-label="Filter by priority"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-44 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("priority", event.target.value);
        } else {
          next.delete("priority");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All priorities</option>
      {TASK_PRIORITIES.map((priority) => (
        <option key={priority} value={priority}>
          {priority.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}

export function TaskViewToggle() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") === "kanban" ? "kanban" : "list";

  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-1">
      {(["list", "kanban"] as const).map((option) => {
        const active = view === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params.toString());
              if (option === "list") {
                next.delete("view");
              } else {
                next.set("view", option);
              }
              next.delete("cursor");
              router.push(`?${next.toString()}`);
            }}
            className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
              active ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
