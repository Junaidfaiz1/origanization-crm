import { describe, expect, it } from "vitest";
import { calculateProposalTotals } from "@/modules/proposals/calculations";
import {
  assertCanAcceptProposal,
  assertCanEditProposal,
  assertCanRejectProposal,
  assertCanSendProposal,
} from "@/modules/proposals/rules";
import { createProposalSchema, proposalListFilterSchema } from "@/modules/proposals/validation";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("proposal calculations", () => {
  it("calculates totals from items, discount, and tax", () => {
    const totals = calculateProposalTotals({
      items: [
        { description: "Build", quantity: 1, unitPrice: 4000 },
        { description: "Launch", quantity: 1, unitPrice: 4000 },
      ],
      discount: 500,
      tax: 100,
    });

    expect(totals.subtotal).toBe(8000);
    expect(totals.total).toBe(7600);
    expect(totals.lineItems[0].lineTotal).toBe(4000);
  });
});

describe("proposal rules", () => {
  it("only sends drafts with line items", () => {
    expect(() =>
      assertCanSendProposal({ status: "DRAFT", archivedAt: null, itemCount: 1 }),
    ).not.toThrow();
    expect(() =>
      assertCanSendProposal({ status: "SENT", archivedAt: null, itemCount: 1 }),
    ).toThrow(BusinessRuleError);
  });

  it("only edits draft or changes-requested proposals", () => {
    expect(() =>
      assertCanEditProposal({ status: "DRAFT", archivedAt: null }),
    ).not.toThrow();
    expect(() =>
      assertCanEditProposal({ status: "SENT", archivedAt: null }),
    ).toThrow(BusinessRuleError);
  });

  it("allows accept and reject only for sent-side statuses", () => {
    expect(() =>
      assertCanAcceptProposal({ status: "VIEWED", archivedAt: null }),
    ).not.toThrow();
    expect(() =>
      assertCanRejectProposal({ status: "CHANGES_REQUESTED", archivedAt: null }),
    ).not.toThrow();
    expect(() =>
      assertCanAcceptProposal({ status: "REJECTED", archivedAt: null }),
    ).toThrow(BusinessRuleError);
  });
});

describe("proposal validation", () => {
  it("requires an opportunity, title, and at least one item", () => {
    expect(
      createProposalSchema.safeParse({
        opportunityId: "",
        title: "A",
        items: [],
      }).success,
    ).toBe(false);
    expect(
      createProposalSchema.safeParse({
        opportunityId: "opp_1",
        title: "ABC Dental Proposal",
        items: [{ description: "Build", quantity: 1, unitPrice: 8000 }],
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = proposalListFilterSchema.parse({
      search: "dental",
      status: "SENT",
      clientId: "client_1",
      opportunityId: "opp_1",
      first: "20",
    });

    expect(parsed.status).toBe("SENT");
    expect(parsed.clientId).toBe("client_1");
    expect(parsed.opportunityId).toBe("opp_1");
  });
});

describe("proposal tenant isolation", () => {
  it("scopes queries by organizationId", () => {
    const where = tenantWhere("org_a", { status: "DRAFT" });
    expect(where.organizationId).toBe("org_a");
  });

  it("uses proposal permissions for CRM and portal roles", () => {
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "PROPOSAL_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROPOSAL_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROPOSAL_ACCEPT")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "PROPOSAL_VIEW")).toBe(false);
  });
});
