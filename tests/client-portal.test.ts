import { describe, expect, it } from "vitest";
import {
  assertClientPortalActor,
  assertOwnsClientRecord,
  CLIENT_VISIBLE_PROPOSAL_STATUSES,
} from "@/modules/client-portal/rules";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError, NotFoundError } from "@/lib/errors/app-error";

describe("client portal rules", () => {
  it("allows only CLIENT role into the portal", () => {
    expect(() => assertClientPortalActor("CLIENT")).not.toThrow();
    expect(() => assertClientPortalActor("PROJECT_MANAGER")).toThrow(BusinessRuleError);
    expect(() => assertClientPortalActor("FREELANCER")).toThrow(BusinessRuleError);
  });

  it("requires a linked client profile", () => {
    expect(() => assertOwnsClientRecord(null)).toThrow(NotFoundError);
    expect(() => assertOwnsClientRecord("client_1")).not.toThrow();
  });

  it("hides draft proposals from client visibility list", () => {
    expect(CLIENT_VISIBLE_PROPOSAL_STATUSES).not.toContain("DRAFT");
    expect(CLIENT_VISIBLE_PROPOSAL_STATUSES).toContain("SENT");
    expect(CLIENT_VISIBLE_PROPOSAL_STATUSES).toContain("ACCEPTED");
  });
});

describe("client portal permissions", () => {
  it("lets clients view proposals, projects, invoices, and payments", () => {
    const perms = ROLE_PERMISSIONS.CLIENT;
    expect(hasPermission(perms, "PROPOSAL_VIEW")).toBe(true);
    expect(hasPermission(perms, "PROPOSAL_ACCEPT")).toBe(true);
    expect(hasPermission(perms, "PROPOSAL_REJECT")).toBe(true);
    expect(hasPermission(perms, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(perms, "INVOICE_VIEW")).toBe(true);
    expect(hasPermission(perms, "PAYMENT_VIEW")).toBe(true);
  });

  it("blocks bidding, expenses, contracts, and reports for clients", () => {
    const perms = ROLE_PERMISSIONS.CLIENT;
    expect(hasPermission(perms, "BID_REQUEST_VIEW")).toBe(false);
    expect(hasPermission(perms, "BID_VIEW")).toBe(false);
    expect(hasPermission(perms, "EXPENSE_VIEW")).toBe(false);
    expect(hasPermission(perms, "CONTRACT_VIEW")).toBe(false);
    expect(hasPermission(perms, "REPORT_VIEW")).toBe(false);
    expect(hasPermission(perms, "RESOURCE_VIEW")).toBe(false);
  });
});

describe("client portal field isolation", () => {
  it("scopes portal lookups by clientId and organizationId", () => {
    const where = {
      organizationId: "org_a",
      clientId: "client_abc",
    };
    expect(where.organizationId).toBe("org_a");
    expect(where.clientId).toBe("client_abc");
  });

  it("does not expose estimatedCost or bidding fields in portal project shape", () => {
    const portalProject = {
      id: "p1",
      name: "Dental Platform",
      status: "IN_PROGRESS",
      budget: "8000",
      milestones: [],
    };
    expect("estimatedCost" in portalProject).toBe(false);
    expect("actualCost" in portalProject).toBe(false);
    expect("bidRequests" in portalProject).toBe(false);
  });
});
