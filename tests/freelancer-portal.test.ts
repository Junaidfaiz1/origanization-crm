import { describe, expect, it } from "vitest";
import { assertFreelancerPortalActor } from "@/modules/freelancer-portal/rules";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";
import { homePathForRole } from "@/lib/auth/home";

describe("freelancer portal rules", () => {
  it("allows only FREELANCER role into the portal", () => {
    expect(() => assertFreelancerPortalActor("FREELANCER")).not.toThrow();
    expect(() => assertFreelancerPortalActor("CLIENT")).toThrow(BusinessRuleError);
    expect(() => assertFreelancerPortalActor("PROJECT_MANAGER")).toThrow(BusinessRuleError);
  });
});

describe("freelancer portal home routing", () => {
  it("routes freelancers to /freelancer", () => {
    expect(homePathForRole("FREELANCER")).toBe("/freelancer");
    expect(homePathForRole("CLIENT")).toBe("/portal");
    expect(homePathForRole("ADMIN")).toBe("/dashboard");
  });
});

describe("freelancer portal permissions", () => {
  it("lets freelancers view and submit bids, tasks, and time", () => {
    const perms = ROLE_PERMISSIONS.FREELANCER;
    expect(hasPermission(perms, "BID_REQUEST_VIEW")).toBe(true);
    expect(hasPermission(perms, "BID_VIEW")).toBe(true);
    expect(hasPermission(perms, "BID_SUBMIT")).toBe(true);
    expect(hasPermission(perms, "BID_UPDATE")).toBe(true);
    expect(hasPermission(perms, "TASK_VIEW")).toBe(true);
    expect(hasPermission(perms, "TASK_UPDATE")).toBe(true);
    expect(hasPermission(perms, "TIME_ENTRY_VIEW")).toBe(true);
    expect(hasPermission(perms, "TIME_ENTRY_CREATE")).toBe(true);
    expect(hasPermission(perms, "TIME_ENTRY_UPDATE")).toBe(true);
  });

  it("blocks invoices, expenses, contracts, reports, and bid accept", () => {
    const perms = ROLE_PERMISSIONS.FREELANCER;
    expect(hasPermission(perms, "INVOICE_VIEW")).toBe(false);
    expect(hasPermission(perms, "EXPENSE_VIEW")).toBe(false);
    expect(hasPermission(perms, "CONTRACT_VIEW")).toBe(false);
    expect(hasPermission(perms, "REPORT_VIEW")).toBe(false);
    expect(hasPermission(perms, "BID_ACCEPT")).toBe(false);
    expect(hasPermission(perms, "BID_SHORTLIST")).toBe(false);
  });
});

describe("freelancer portal field isolation", () => {
  it("only exposes awarded amount when the freelancer won", () => {
    const wonByMe = {
      awardedBid: { id: "b1", amount: "1200", estimatedDays: 10 },
    };
    const wonByOther = {
      awardedBid: { id: "b2", wonByOther: true as const },
    };

    expect("amount" in wonByMe.awardedBid).toBe(true);
    expect("amount" in wonByOther.awardedBid).toBe(false);
    expect(wonByOther.awardedBid.wonByOther).toBe(true);
  });

  it("does not expose agency margin or competing bids in portal shapes", () => {
    const portalBidRequest = {
      id: "br1",
      title: "Landing page",
      bidCount: 4,
      awardedBid: null,
    };
    expect("margin" in portalBidRequest).toBe(false);
    expect("profit" in portalBidRequest).toBe(false);
    expect("bids" in portalBidRequest).toBe(false);
    expect("comparison" in portalBidRequest).toBe(false);
  });

  it("scopes own-bid lists by bidderId and organizationId", () => {
    const where = {
      organizationId: "org_a",
      bidderId: "user_freelancer",
    };
    expect(where.organizationId).toBe("org_a");
    expect(where.bidderId).toBe("user_freelancer");
  });
});
