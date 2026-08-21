"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { INVOICE_STATUSES } from "@/modules/invoices/rules";

type InvoiceSummary = {
  total: number;
  draftCount: number;
  outstandingCount: number;
  paidCount: number;
  outstandingAmount: string;
  paidAmount: string;
  stages: Array<{ status: string; count: number }>;
};

export function InvoiceSummaryCards({ summary }: { summary: InvoiceSummary }) {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") ?? "";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.outstandingCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <MoneyDisplay amount={summary.outstandingAmount} />
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.paidCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <MoneyDisplay amount={summary.paidAmount} />
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Drafts</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.draftCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.total} total</p>
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
          <Link href="/invoices" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function InvoiceStatusFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("status") ?? "";

  return (
    <select
      aria-label="Filter by status"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-44 md:h-10 md:text-sm"
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
      {INVOICE_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}

export function InvoiceClientFilter({
  clients,
}: {
  clients: Array<{ id: string; company: { name: string } }>;
}) {
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

export function InvoiceProjectFilter({
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
