/**
 * Phase 12 service-layer E2E: lead → convert → proposal → project → bid accept
 * → invoice → manual payment → profit.
 *
 * Payments are MANUAL only (BANK_TRANSFER / CASH / …). No Stripe webhook.
 * Uses real module rules, validations, and finance helpers (no Prisma / Playwright).
 */
import { describe, expect, it } from "vitest";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { calculateProfit } from "@/lib/finance/profit";
import { tenantWhere } from "@/lib/tenant";
import { BusinessRuleError } from "@/lib/errors/app-error";
import {
  assertCanConvertLead,
  conversionNames,
} from "@/modules/leads/rules";
import { createLeadSchema } from "@/modules/leads/validation";
import { calculateProposalTotals } from "@/modules/proposals/calculations";
import {
  assertCanAcceptProposal,
  assertCanSendProposal,
} from "@/modules/proposals/rules";
import { createProposalSchema } from "@/modules/proposals/validation";
import {
  assertCanNegotiate,
  assertCanOpenBidRequest,
  assertCanRejectBid,
  canAcceptBid,
  canSubmitBid,
  validateBidValues,
} from "@/modules/bidding/rules";
import {
  createBidRequestSchema,
  submitBidSchema,
} from "@/modules/bidding/validation";
import {
  applyPayment,
  calculateInvoiceTotals,
} from "@/modules/invoices/calculations";
import { assertCanSendInvoice } from "@/modules/invoices/rules";
import { createInvoiceSchema } from "@/modules/invoices/validation";
import {
  assertCanRecordPaymentOnInvoice,
  assertPaymentAmount,
  PAYMENT_METHODS,
} from "@/modules/payments/rules";
import { recordPaymentSchema } from "@/modules/payments/validation";

type WorkflowState = {
  orgId: string;
  lead: {
    id: string;
    status: string;
    archivedAt: Date | null;
    convertedClientId: string | null;
    name: string;
    companyName: string | null;
  };
  clientId: string | null;
  opportunityId: string | null;
  proposal: {
    id: string;
    status: "DRAFT" | "SENT" | "ACCEPTED";
    archivedAt: Date | null;
    itemCount: number;
    total: number;
  } | null;
  project: {
    id: string;
    status: string;
    clientId: string;
    budget: number;
  } | null;
  bidRequest: {
    id: string;
    status: string;
    awardedBidId: string | null;
  } | null;
  bids: Array<{
    id: string;
    bidRequestId: string;
    status: string;
    amount: number;
    originalAmount: number;
    estimatedDays: number;
    negotiations: Array<{ offeredAmount: number }>;
  }>;
  invoice: {
    id: string;
    status: string;
    total: number;
    amountPaid: number;
    amountDue: number;
    itemCount: number;
  } | null;
  payments: Array<{
    id: string;
    provider: "MANUAL";
    method: (typeof PAYMENT_METHODS)[number];
    amount: number;
    status: "SUCCEEDED";
  }>;
};

function createInitialState(): WorkflowState {
  return {
    orgId: "org_technova",
    lead: {
      id: "lead_e2e_1",
      status: "QUALIFIED",
      archivedAt: null,
      convertedClientId: null,
      name: "Dr. Amira Hassan",
      companyName: "Riverside Dental",
    },
    clientId: null,
    opportunityId: null,
    proposal: null,
    project: null,
    bidRequest: null,
    bids: [],
    invoice: null,
    payments: [],
  };
}

describe("E2E workflow: lead → bid accept → invoice → manual payment", () => {
  it("runs the full happy path with MANUAL payment (no Stripe)", () => {
    const state = createInitialState();
    const sales = ROLE_PERMISSIONS.SALES_MANAGER;
    const pm = ROLE_PERMISSIONS.PROJECT_MANAGER;
    const finance = ROLE_PERMISSIONS.FINANCE_MANAGER;
    const freelancer = ROLE_PERMISSIONS.FREELANCER;

    // --- 1. Lead create + convert ---
    expect(hasPermission(sales, "LEAD_CREATE")).toBe(true);
    expect(
      createLeadSchema.safeParse({
        name: state.lead.name,
        companyName: state.lead.companyName,
        email: "amira@riverside.test",
        status: "QUALIFIED",
      }).success,
    ).toBe(true);

    assertCanConvertLead(state.lead);
    const names = conversionNames(state.lead);
    state.clientId = "client_e2e_1";
    state.opportunityId = "opp_e2e_1";
    state.lead = {
      ...state.lead,
      status: "CONVERTED",
      convertedClientId: state.clientId,
    };
    expect(names.companyName).toBe("Riverside Dental");
    expect(names.opportunityName).toContain("Riverside Dental");
    expect(() => assertCanConvertLead(state.lead)).toThrow(BusinessRuleError);

    // --- 2. Proposal send + accept → project ---
    expect(hasPermission(sales, "PROPOSAL_CREATE")).toBe(true);
    const proposalItems = [
      { description: "CRM implementation", quantity: 1, unitPrice: 8000 },
      { description: "Onboarding", quantity: 1, unitPrice: 2000 },
    ];
    expect(
      createProposalSchema.safeParse({
        opportunityId: state.opportunityId,
        title: "Riverside Dental proposal",
        items: proposalItems,
      }).success,
    ).toBe(true);

    const proposalTotals = calculateProposalTotals({ items: proposalItems });
    state.proposal = {
      id: "prop_e2e_1",
      status: "DRAFT",
      archivedAt: null,
      itemCount: proposalItems.length,
      total: proposalTotals.total,
    };
    assertCanSendProposal(state.proposal);
    state.proposal.status = "SENT";
    assertCanAcceptProposal(state.proposal);
    state.proposal.status = "ACCEPTED";

    state.project = {
      id: "project_e2e_1",
      status: "PLANNING",
      clientId: state.clientId!,
      budget: proposalTotals.total,
    };
    expect(state.project.budget).toBe(10000);
    expect(state.proposal.status).toBe("ACCEPTED");

    // --- 3. Bid request open → submit → negotiate → accept one ---
    expect(hasPermission(pm, "BID_REQUEST_CREATE")).toBe(true);
    expect(hasPermission(freelancer, "BID_SUBMIT")).toBe(true);
    expect(hasPermission(pm, "BID_ACCEPT")).toBe(true);
    expect(hasPermission(freelancer, "BID_ACCEPT")).toBe(false);

    expect(
      createBidRequestSchema.safeParse({
        projectId: state.project.id,
        title: "Full-stack build",
      }).success,
    ).toBe(true);

    state.bidRequest = {
      id: "breq_e2e_1",
      status: "DRAFT",
      awardedBidId: null,
    };
    assertCanOpenBidRequest(state.bidRequest);
    state.bidRequest.status = "OPEN";
    expect(canSubmitBid(state.bidRequest)).toBeNull();

    const bidA = {
      id: "bid_a",
      bidRequestId: state.bidRequest.id,
      status: "SUBMITTED",
      amount: 6500,
      originalAmount: 6500,
      estimatedDays: 45,
      negotiations: [] as Array<{ offeredAmount: number }>,
    };
    const bidB = {
      id: "bid_b",
      bidRequestId: state.bidRequest.id,
      status: "SUBMITTED",
      amount: 7200,
      originalAmount: 7200,
      estimatedDays: 40,
      negotiations: [] as Array<{ offeredAmount: number }>,
    };
    expect(validateBidValues(bidA.amount, bidA.estimatedDays)).toBeNull();
    expect(
      submitBidSchema.safeParse({
        bidRequestId: state.bidRequest.id,
        amount: String(bidA.amount),
        estimatedDays: String(bidA.estimatedDays),
      }).success,
    ).toBe(true);
    state.bids.push(bidA, bidB);

    assertCanNegotiate(bidA, state.bidRequest);
    bidA.negotiations.push({ offeredAmount: 6200 });
    bidA.amount = 6200;
    bidA.status = "NEGOTIATION";
    // Never overwrite the original bid amount — append negotiation history only.
    expect(bidA.originalAmount).toBe(6500);
    expect(bidA.amount).toBe(6200);
    expect(bidA.negotiations).toHaveLength(1);

    expect(canAcceptBid(state.bidRequest, bidA, state.bidRequest.id)).toBeNull();
    // Accept transaction: reject others while request still has no winner, then award.
    assertCanRejectBid(bidB, state.bidRequest);
    bidB.status = "REJECTED";
    bidA.status = "ACCEPTED";
    state.bidRequest.awardedBidId = bidA.id;
    state.bidRequest.status = "AWARDED";
    state.project.status = "RESOURCE_ASSIGNED";

    expect(state.bidRequest.awardedBidId).toBe("bid_a");
    expect(state.bids.filter((b) => b.status === "ACCEPTED")).toHaveLength(1);
    expect(state.bids.filter((b) => b.status === "REJECTED")).toHaveLength(1);
    expect(canAcceptBid(state.bidRequest, bidB, state.bidRequest.id)).toMatch(
      /not open for award|winning bid already exists/i,
    );

    // --- 4. Invoice draft → send ---
    expect(hasPermission(finance, "INVOICE_CREATE")).toBe(true);
    const invoiceItems = [
      { description: "Milestone 1 — discovery", quantity: 1, unitPrice: 4000 },
      { description: "Milestone 2 — build", quantity: 1, unitPrice: 6000 },
    ];
    expect(
      createInvoiceSchema.safeParse({
        clientId: state.clientId,
        projectId: state.project.id,
        issueDate: "2026-08-15",
        items: invoiceItems,
      }).success,
    ).toBe(true);

    const invoiceTotals = calculateInvoiceTotals({ items: invoiceItems });
    state.invoice = {
      id: "inv_e2e_1",
      status: "DRAFT",
      total: invoiceTotals.total,
      amountPaid: 0,
      amountDue: invoiceTotals.total,
      itemCount: invoiceItems.length,
    };
    expect(state.invoice.total).toBe(10000);
    assertCanSendInvoice(state.invoice);
    state.invoice.status = "SENT";

    // --- 5. Manual payments only (no Stripe) ---
    expect(PAYMENT_METHODS).not.toContain("STRIPE");
    expect(hasPermission(finance, "PAYMENT_CREATE")).toBe(true);

    assertCanRecordPaymentOnInvoice(state.invoice);
    assertPaymentAmount(4000, state.invoice.amountDue);

    const partialInput = recordPaymentSchema.parse({
      invoiceId: state.invoice.id,
      amount: "4000.00",
      method: "BANK_TRANSFER",
      paidAt: "2026-08-20",
      reference: "WIRE-RIV-001",
    });
    expect(partialInput.method).toBe("BANK_TRANSFER");

    const partial = applyPayment(
      state.invoice.amountPaid,
      4000,
      state.invoice.total,
    );
    state.invoice.amountPaid = partial.amountPaid;
    state.invoice.amountDue = partial.amountDue;
    state.invoice.status = partial.status;
    state.payments.push({
      id: "pay_e2e_1",
      provider: "MANUAL",
      method: "BANK_TRANSFER",
      amount: 4000,
      status: "SUCCEEDED",
    });
    expect(state.invoice.status).toBe("PARTIALLY_PAID");
    expect(state.invoice.amountDue).toBe(6000);

    assertCanRecordPaymentOnInvoice(state.invoice);
    expect(() => assertPaymentAmount(7000, state.invoice!.amountDue)).toThrow(
      BusinessRuleError,
    );

    const final = applyPayment(
      state.invoice.amountPaid,
      6000,
      state.invoice.total,
    );
    state.invoice.amountPaid = final.amountPaid;
    state.invoice.amountDue = final.amountDue;
    state.invoice.status = final.status;
    state.payments.push({
      id: "pay_e2e_2",
      provider: "MANUAL",
      method: "CASH",
      amount: 6000,
      status: "SUCCEEDED",
    });
    expect(state.invoice.status).toBe("PAID");
    expect(state.invoice.amountDue).toBe(0);
    expect(state.payments.every((p) => p.provider === "MANUAL")).toBe(true);
    expect(() =>
      assertCanRecordPaymentOnInvoice({
        status: "SENT",
        total: state.invoice!.total,
        amountPaid: state.invoice!.total,
        amountDue: 0,
      }),
    ).toThrow(/no remaining balance/i);
    expect(() =>
      assertCanRecordPaymentOnInvoice(state.invoice!),
    ).toThrow(/sent, partially paid, or overdue/i);

    // --- 6. Profit (manual payments → no paymentFees) ---
    const profit = calculateProfit({
      revenue: state.invoice.total,
      resourceCost: bidA.amount,
      expenses: 150,
      paymentFees: 0,
    });
    expect(profit.profit).toBe(10000 - 6200 - 150);
    expect(profit.profitMargin).toBeCloseTo((3650 / 10000) * 100);
    expect(profit.paymentFees).toBe(0);

    // Tenant scope stays on session org throughout
    expect(tenantWhere(state.orgId, { id: state.invoice.id }).organizationId).toBe(
      "org_technova",
    );
  });

  it("blocks portal roles from internal finance / bidding award steps", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "BID_ACCEPT")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PAYMENT_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "INVOICE_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "LEAD_VIEW")).toBe(false);
  });
});
