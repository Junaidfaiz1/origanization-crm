"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/modules/payments/rules";

type PaymentSummary = {
  total: number;
  succeededCount: number;
  refundedCount: number;
  succeededAmount: string;
  refundedAmount: string;
  stages: Array<{ status: string; count: number }>;
};

export function PaymentSummaryCards({ summary }: { summary: PaymentSummary }) {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") ?? "";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recorded</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.succeededCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <MoneyDisplay amount={summary.succeededAmount} />
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Voided</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.refundedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            <MoneyDisplay amount={summary.refundedAmount} />
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total entries</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">{summary.total}</p>
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
          <Link href="/payments" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function PaymentStatusFilter() {
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
      {PAYMENT_STATUSES.map((status) => (
        <option key={status} value={status}>
          {status.replaceAll("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}

export function PaymentMethodFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("method") ?? "";

  return (
    <select
      aria-label="Filter by method"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("method", event.target.value);
        } else {
          next.delete("method");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All methods</option>
      {PAYMENT_METHODS.map((method) => (
        <option key={method} value={method}>
          {method.replaceAll("_", " ").toLowerCase()}
        </option>
      ))}
    </select>
  );
}
