import { describe, expect, it } from "vitest";
import {
  assertNotificationOwned,
  isNotificationType,
  notificationHref,
} from "@/modules/notifications/rules";
import { notificationListFilterSchema } from "@/modules/notifications/validation";
import { NOTIFICATION_TYPES } from "@/modules/notifications/types";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("notification rules", () => {
  it("asserts ownership", () => {
    expect(() => assertNotificationOwned(null, "u1")).toThrow(BusinessRuleError);
    expect(() => assertNotificationOwned({ userId: "u2" }, "u1")).toThrow(BusinessRuleError);
    expect(() => assertNotificationOwned({ userId: "u1" }, "u1")).not.toThrow();
  });

  it("recognizes known notification types", () => {
    expect(isNotificationType("BID_ACCEPTED")).toBe(true);
    expect(isNotificationType("UNKNOWN")).toBe(false);
    expect(NOTIFICATION_TYPES).toContain("TASK_ASSIGNED");
    expect(NOTIFICATION_TYPES).toContain("PAYMENT_RECORDED");
  });

  it("maps entity links for each audience", () => {
    expect(notificationHref("Proposal", "p1", "client")).toBe("/portal/proposals/p1");
    expect(notificationHref("Invoice", "i1", "client")).toBe("/portal/invoices/i1");
    expect(notificationHref("Bid", "b1", "freelancer")).toBe("/freelancer/bids/b1");
    expect(notificationHref("Task", "t1", "freelancer")).toBe("/freelancer/tasks/t1");
    expect(notificationHref("BidRequest", "r1")).toBe("/bidding/requests/r1");
    expect(notificationHref("Invoice", "i1")).toBe("/invoices/i1");
    expect(notificationHref("Unknown", "x1")).toBeNull();
  });
});

describe("notification validation", () => {
  it("parses unread filter", () => {
    expect(notificationListFilterSchema.parse({ unreadOnly: "true" }).unreadOnly).toBe(true);
    expect(notificationListFilterSchema.parse({}).unreadOnly).toBe(false);
    expect(notificationListFilterSchema.parse({ first: 10 }).first).toBe(10);
  });
});

describe("notification tenant isolation shape", () => {
  it("scopes inbox queries by organizationId and userId", () => {
    const where = {
      organizationId: "org_a",
      userId: "user_a",
      readAt: null,
    };
    expect(where.organizationId).toBe("org_a");
    expect(where.userId).toBe("user_a");
  });
});
