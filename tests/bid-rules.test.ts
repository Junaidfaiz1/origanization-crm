import { describe, expect, it } from "vitest";
import {
  assertCanCloseBidRequest,
  assertCanNegotiate,
  assertCanOpenBidRequest,
  assertCanRejectBid,
  assertCanShortlistBid,
  assertCanWithdrawBid,
  canAcceptBid,
  canSubmitBid,
  scoreBid,
  validateBidValues,
} from "@/modules/bidding/rules";
import {
  createBidRequestSchema,
  submitBidSchema,
} from "@/modules/bidding/validation";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("bid rules", () => {
  it("blocks submissions on closed requests", () => {
    expect(canSubmitBid({ status: "CLOSED", awardedBidId: null })).toMatch(
      /cannot accept new bids/i,
    );
    expect(canSubmitBid({ status: "OPEN", awardedBidId: null })).toBeNull();
  });

  it("requires positive amount and days", () => {
    expect(validateBidValues(0, 10)).toMatch(/positive/i);
    expect(validateBidValues(100, 0)).toMatch(/positive/i);
    expect(validateBidValues(6500, 70)).toBeNull();
  });

  it("prevents accepting a rejected bid or a second winner", () => {
    const request = { status: "OPEN", awardedBidId: null };
    expect(
      canAcceptBid(
        request,
        {
          id: "b1",
          bidRequestId: "r1",
          status: "REJECTED",
          amount: 100,
          estimatedDays: 10,
        },
        "r1",
      ),
    ).toMatch(/rejected/i);

    expect(
      canAcceptBid(
        { status: "OPEN", awardedBidId: "winner" },
        {
          id: "b2",
          bidRequestId: "r1",
          status: "SUBMITTED",
          amount: 100,
          estimatedDays: 10,
        },
        "r1",
      ),
    ).toMatch(/winning bid already exists/i);
  });

  it("allows accept on open submitted bids", () => {
    expect(
      canAcceptBid(
        { status: "OPEN", awardedBidId: null },
        {
          id: "b1",
          bidRequestId: "r1",
          status: "SUBMITTED",
          amount: 7000,
          estimatedDays: 55,
        },
        "r1",
      ),
    ).toBeNull();
  });

  it("scores lower price and faster delivery higher", () => {
    const shared = {
      minAmount: 6500,
      maxAmount: 7500,
      minDays: 50,
      maxDays: 70,
      maxExperience: 8,
    };

    const a = scoreBid({
      amount: 7000,
      experienceYears: 6,
      rating: 4.6,
      estimatedDays: 55,
      ...shared,
    });
    const b = scoreBid({
      amount: 6500,
      experienceYears: 5,
      rating: 4.2,
      estimatedDays: 70,
      ...shared,
    });
    const c = scoreBid({
      amount: 7500,
      experienceYears: 8,
      rating: 4.8,
      estimatedDays: 50,
      ...shared,
    });

    expect(a.total).toBeGreaterThan(0);
    expect(b.breakdown.price).toBeGreaterThan(c.breakdown.price);
    expect(c.breakdown.delivery).toBeGreaterThan(b.breakdown.delivery);
  });

  it("gates open/close/shortlist/reject/withdraw/negotiate", () => {
    expect(() =>
      assertCanOpenBidRequest({ status: "OPEN", awardedBidId: null }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanOpenBidRequest({ status: "DRAFT", awardedBidId: null }),
    ).not.toThrow();

    expect(() =>
      assertCanCloseBidRequest({ status: "AWARDED", awardedBidId: "x" }),
    ).toThrow(BusinessRuleError);

    expect(() =>
      assertCanShortlistBid(
        { status: "SUBMITTED" },
        { status: "OPEN", awardedBidId: null },
      ),
    ).not.toThrow();

    expect(() =>
      assertCanRejectBid(
        { status: "ACCEPTED" },
        { status: "OPEN", awardedBidId: null },
      ),
    ).toThrow(BusinessRuleError);

    expect(() => assertCanWithdrawBid({ status: "SUBMITTED" })).not.toThrow();
    expect(() => assertCanWithdrawBid({ status: "ACCEPTED" })).toThrow(
      BusinessRuleError,
    );

    expect(() =>
      assertCanNegotiate(
        { status: "SHORTLISTED" },
        { status: "OPEN", awardedBidId: null },
      ),
    ).not.toThrow();
  });
});

describe("bidding validation", () => {
  it("requires project and title for requests", () => {
    expect(createBidRequestSchema.safeParse({ projectId: "", title: "" }).success).toBe(
      false,
    );
    expect(
      createBidRequestSchema.safeParse({
        projectId: "project_1",
        title: "Full-stack build",
      }).success,
    ).toBe(true);
  });

  it("requires amount and days for submissions", () => {
    expect(
      submitBidSchema.safeParse({
        bidRequestId: "req_1",
        amount: "7000",
        estimatedDays: "55",
      }).success,
    ).toBe(true);
    expect(
      submitBidSchema.safeParse({
        bidRequestId: "req_1",
        amount: "",
        estimatedDays: 0,
      }).success,
    ).toBe(false);
  });
});

describe("bidding tenant + authz", () => {
  it("scopes queries by organizationId", () => {
    const where = tenantWhere("org_a", { status: "OPEN" });
    expect(where.organizationId).toBe("org_a");
  });

  it("grants managers award powers and freelancers submit powers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "BID_ACCEPT")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "BID_SHORTLIST")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "BID_SUBMIT")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "BID_ACCEPT")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "BID_REQUEST_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "BID_VIEW")).toBe(false);
  });
});
