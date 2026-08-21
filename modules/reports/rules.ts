import { AuthorizationError } from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";

type Actor = {
  permissions?: string[];
};

export function assertCanViewReports(actor: Actor): void {
  if (!hasPermission(actor.permissions ?? [], "REPORT_VIEW")) {
    throw new AuthorizationError("Missing REPORT_VIEW");
  }
}

/** Display margin; never NaN when revenue is 0. */
export function formatMarginPercent(margin: number | null | undefined): string {
  if (margin == null || Number.isNaN(margin)) {
    return "—";
  }
  return `${margin.toFixed(1)}%`;
}

export function formatMoney(value: number): string {
  return value.toFixed(2);
}

export function formatRate(numerator: number, denominator: number): string | null {
  if (denominator <= 0) {
    return null;
  }
  return ((numerator / denominator) * 100).toFixed(1);
}

export const ACTIVE_PROJECT_STATUSES = [
  "PLANNING",
  "BIDDING",
  "RESOURCE_ASSIGNED",
  "IN_PROGRESS",
  "IN_REVIEW",
] as const;

export const OUTSTANDING_INVOICE_STATUSES = [
  "SENT",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

export const PENDING_PROPOSAL_STATUSES = [
  "SENT",
  "VIEWED",
  "CHANGES_REQUESTED",
] as const;
