import { describe, expect, it, afterEach } from "vitest";
import { AuthorizationError } from "@/lib/errors/app-error";
import { assertCronAuthorized } from "@/lib/cron/auth";
import {
  bidRequestExpiredWhere,
  invoiceOverdueWhere,
  invoiceReminderWhere,
  proposalExpiredWhere,
  reminderLookbackStart,
} from "@/modules/cron/rules";
import { isNotificationType } from "@/modules/notifications/rules";

describe("cron auth", () => {
  const previous = process.env.CRON_SECRET;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = previous;
    }
  });

  it("rejects when CRON_SECRET is missing", () => {
    process.env.CRON_SECRET = "";
    const request = new Request("http://localhost/api/cron/expire-bids");
    expect(() => assertCronAuthorized(request)).toThrow(AuthorizationError);
  });

  it("accepts Authorization Bearer matching CRON_SECRET", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const request = new Request("http://localhost/api/cron/expire-bids", {
      headers: { Authorization: "Bearer test-cron-secret-value" },
    });
    expect(() => assertCronAuthorized(request)).not.toThrow();
  });

  it("accepts x-cron-secret header", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const request = new Request("http://localhost/api/cron/expire-bids", {
      headers: { "x-cron-secret": "test-cron-secret-value" },
    });
    expect(() => assertCronAuthorized(request)).not.toThrow();
  });

  it("rejects wrong secrets", () => {
    process.env.CRON_SECRET = "test-cron-secret-value";
    const request = new Request("http://localhost/api/cron/expire-bids", {
      headers: { Authorization: "Bearer wrong-secret-value!!" },
    });
    expect(() => assertCronAuthorized(request)).toThrow(AuthorizationError);
  });
});

describe("cron selection rules", () => {
  const now = new Date("2026-08-24T12:00:00.000Z");

  it("selects open/paused bid requests past endsAt or deadline", () => {
    const where = bidRequestExpiredWhere(now);
    expect(where.status).toEqual({ in: ["OPEN", "PAUSED"] });
    expect(where.awardedBidId).toBeNull();
    expect(where.OR).toHaveLength(2);
  });

  it("selects sent-side proposals past validUntil", () => {
    const where = proposalExpiredWhere(now);
    expect(where.status).toEqual({
      in: ["SENT", "VIEWED", "CHANGES_REQUESTED"],
    });
    expect(where.validUntil).toEqual({ lt: now });
    expect(where.archivedAt).toBeNull();
  });

  it("selects payable invoices past due for overdue marking", () => {
    const where = invoiceOverdueWhere(now);
    expect(where.status).toEqual({ in: ["SENT", "PARTIALLY_PAID"] });
    expect(where.dueDate).toEqual({ lt: now });
  });

  it("selects outstanding invoices in the reminder window", () => {
    const where = invoiceReminderWhere(now, 3);
    expect(where.status).toEqual({
      in: ["SENT", "PARTIALLY_PAID", "OVERDUE"],
    });
    expect(where.amountDue).toEqual({ gt: 0 });
    expect(where.dueDate).toMatchObject({ not: null });
  });

  it("computes a 24h reminder lookback", () => {
    expect(reminderLookbackStart(now).toISOString()).toBe(
      "2026-08-23T12:00:00.000Z",
    );
  });

  it("includes INVOICE_REMINDER as a known notification type", () => {
    expect(isNotificationType("INVOICE_REMINDER")).toBe(true);
  });
});
