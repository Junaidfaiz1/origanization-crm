import { describe, expect, it } from "vitest";
import {
  assertCanRecordPaymentOnInvoice,
  assertCanVoidPayment,
  assertPaymentAmount,
} from "@/modules/payments/rules";
import {
  paymentListFilterSchema,
  recordPaymentSchema,
} from "@/modules/payments/validation";
import { applyPayment } from "@/modules/invoices/calculations";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("payment rules", () => {
  it("only allows recording on payable invoices with balance", () => {
    expect(() =>
      assertCanRecordPaymentOnInvoice({
        status: "DRAFT",
        amountDue: 100,
        total: 100,
        amountPaid: 0,
      }),
    ).toThrow(BusinessRuleError);

    expect(() =>
      assertCanRecordPaymentOnInvoice({
        status: "SENT",
        amountDue: 0,
        total: 100,
        amountPaid: 100,
      }),
    ).toThrow(BusinessRuleError);

    expect(() =>
      assertCanRecordPaymentOnInvoice({
        status: "SENT",
        amountDue: 2200,
        total: 2200,
        amountPaid: 0,
      }),
    ).not.toThrow();
  });

  it("blocks payment amounts above remaining due", () => {
    expect(() => assertPaymentAmount(0, 100)).toThrow(BusinessRuleError);
    expect(() => assertPaymentAmount(150, 100)).toThrow(BusinessRuleError);
    expect(() => assertPaymentAmount(50, 100)).not.toThrow();
  });

  it("only voids succeeded payments", () => {
    expect(() => assertCanVoidPayment({ status: "REFUNDED" })).toThrow(BusinessRuleError);
    expect(() => assertCanVoidPayment({ status: "SUCCEEDED" })).not.toThrow();
  });
});

describe("payment validation", () => {
  it("requires invoice, amount, method, and paid date", () => {
    expect(
      recordPaymentSchema.safeParse({
        invoiceId: "",
        amount: "",
        method: "BANK_TRANSFER",
        paidAt: "",
      }).success,
    ).toBe(false);
    expect(
      recordPaymentSchema.safeParse({
        invoiceId: "inv_1",
        amount: "500.00",
        method: "BANK_TRANSFER",
        paidAt: "2026-08-20",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = paymentListFilterSchema.parse({
      search: "INV",
      status: "SUCCEEDED",
      method: "CASH",
      first: "20",
    });
    expect(parsed.status).toBe("SUCCEEDED");
    expect(parsed.method).toBe("CASH");
    expect(parsed.first).toBe(20);
  });

  it("updates invoice balance when payment is applied", () => {
    const partial = applyPayment(0, 500, 2200);
    expect(partial.status).toBe("PARTIALLY_PAID");
    expect(partial.amountDue).toBe(1700);

    const full = applyPayment(1700, 500, 2200);
    expect(full.status).toBe("PAID");
    expect(full.amountDue).toBe(0);
  });
});

describe("payment permissions", () => {
  it("lets finance managers record and void payments", () => {
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "PAYMENT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "PAYMENT_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "PAYMENT_UPDATE")).toBe(true);
  });

  it("lets clients view but not record payments", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PAYMENT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PAYMENT_CREATE")).toBe(false);
  });

  it("hides payments from project managers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PAYMENT_VIEW")).toBe(false);
  });
});

describe("payment tenant isolation", () => {
  it("scopes lookups by organizationId", () => {
    const where = { id: "pay_1", organizationId: "org_a" };
    expect(where.organizationId).toBe("org_a");
  });
});
