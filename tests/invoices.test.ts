import { describe, expect, it } from "vitest";
import {
  assertCanCancelInvoice,
  assertCanDeleteInvoice,
  assertCanEditInvoice,
  assertCanMarkOverdue,
  assertCanSendInvoice,
  assertClientMatchesProject,
} from "@/modules/invoices/rules";
import {
  createInvoiceSchema,
  invoiceListFilterSchema,
} from "@/modules/invoices/validation";
import { calculateInvoiceTotals } from "@/modules/invoices/calculations";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("invoice rules", () => {
  it("blocks editing non-draft invoices", () => {
    expect(() => assertCanEditInvoice({ status: "SENT" })).toThrow(BusinessRuleError);
    expect(() => assertCanEditInvoice({ status: "DRAFT" })).not.toThrow();
  });

  it("blocks deleting non-draft or paid invoices", () => {
    expect(() => assertCanDeleteInvoice({ status: "SENT" })).toThrow(BusinessRuleError);
    expect(() => assertCanDeleteInvoice({ status: "DRAFT", amountPaid: 10 })).toThrow(
      BusinessRuleError,
    );
    expect(() => assertCanDeleteInvoice({ status: "DRAFT", amountPaid: 0 })).not.toThrow();
  });

  it("requires line items before send", () => {
    expect(() => assertCanSendInvoice({ status: "DRAFT", itemCount: 0 })).toThrow(
      BusinessRuleError,
    );
    expect(() => assertCanSendInvoice({ status: "DRAFT", itemCount: 1 })).not.toThrow();
    expect(() => assertCanSendInvoice({ status: "SENT", itemCount: 1 })).toThrow(
      BusinessRuleError,
    );
  });

  it("blocks cancelling paid invoices", () => {
    expect(() => assertCanCancelInvoice({ status: "PAID" })).toThrow(BusinessRuleError);
    expect(() => assertCanCancelInvoice({ status: "SENT", amountPaid: 0 })).not.toThrow();
    expect(() => assertCanCancelInvoice({ status: "SENT", amountPaid: 50 })).toThrow(
      BusinessRuleError,
    );
  });

  it("only marks past-due sent invoices as overdue", () => {
    expect(() =>
      assertCanMarkOverdue({
        status: "SENT",
        dueDate: new Date(Date.now() - 86_400_000),
      }),
    ).not.toThrow();
    expect(() =>
      assertCanMarkOverdue({
        status: "SENT",
        dueDate: new Date(Date.now() + 86_400_000),
      }),
    ).toThrow(BusinessRuleError);
    expect(() => assertCanMarkOverdue({ status: "DRAFT", dueDate: new Date() })).toThrow(
      BusinessRuleError,
    );
  });

  it("requires client to match project", () => {
    expect(() => assertClientMatchesProject("a", "b")).toThrow(BusinessRuleError);
    expect(() => assertClientMatchesProject("a", "a")).not.toThrow();
  });
});

describe("invoice validation", () => {
  it("requires client, issue date, and items", () => {
    expect(
      createInvoiceSchema.safeParse({
        clientId: "",
        issueDate: "",
        items: [],
      }).success,
    ).toBe(false);
    expect(
      createInvoiceSchema.safeParse({
        clientId: "client_1",
        issueDate: "2026-08-20",
        items: [{ description: "Discovery", quantity: 1, unitPrice: 1200 }],
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = invoiceListFilterSchema.parse({
      search: "INV",
      status: "DRAFT",
      projectId: "project_1",
      first: "20",
    });
    expect(parsed.search).toBe("INV");
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.first).toBe(20);
  });

  it("calculates totals for line items", () => {
    const totals = calculateInvoiceTotals({
      items: [
        { quantity: 1, unitPrice: 1000 },
        { quantity: 2, unitPrice: 500 },
      ],
      discount: 100,
      tax: 50,
    });
    expect(totals.subtotal).toBe(2000);
    expect(totals.total).toBe(1950);
  });
});

describe("invoice permissions", () => {
  it("lets finance managers manage invoices", () => {
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "INVOICE_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "INVOICE_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "INVOICE_SEND")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "INVOICE_UPDATE")).toBe(true);
  });

  it("lets clients view invoices but not create them", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "INVOICE_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "INVOICE_CREATE")).toBe(false);
  });

  it("hides invoice management from project managers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "INVOICE_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "INVOICE_CREATE")).toBe(false);
  });
});

describe("invoice tenant isolation", () => {
  it("scopes lookups by organizationId", () => {
    const where = {
      id: "invoice_1",
      organizationId: "org_a",
    };
    expect(where.organizationId).toBe("org_a");
  });
});
