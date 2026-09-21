import type { Prisma } from "@/generated/prisma/client";

export const CRON_BATCH_SIZE = 100;

/** Bid requests past endsAt or deadline that are still open for bidding. */
export function bidRequestExpiredWhere(now: Date): Prisma.BidRequestWhereInput {
  return {
    status: { in: ["OPEN", "PAUSED"] },
    awardedBidId: null,
    OR: [{ endsAt: { lt: now } }, { deadline: { lt: now } }],
  };
}

/** Sent-side proposals past validUntil. */
export function proposalExpiredWhere(now: Date): Prisma.ProposalWhereInput {
  return {
    status: { in: ["SENT", "VIEWED", "CHANGES_REQUESTED"] },
    archivedAt: null,
    validUntil: { lt: now },
  };
}

/** Payable invoices past dueDate that are not yet OVERDUE/PAID/CANCELLED. */
export function invoiceOverdueWhere(now: Date): Prisma.InvoiceWhereInput {
  return {
    status: { in: ["SENT", "PARTIALLY_PAID"] },
    dueDate: { lt: now },
  };
}

/**
 * Outstanding invoices due within `reminderWindowDays` (includes already overdue).
 * Caller still enforces 24h reminder idempotency via notifications.
 */
export function invoiceReminderWhere(
  now: Date,
  reminderWindowDays = 3,
): Prisma.InvoiceWhereInput {
  const windowEnd = new Date(now);
  windowEnd.setUTCDate(windowEnd.getUTCDate() + reminderWindowDays);

  return {
    status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
    amountDue: { gt: 0 },
    dueDate: { not: null, lte: windowEnd },
  };
}

export function reminderLookbackStart(now: Date, hours = 24): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}
