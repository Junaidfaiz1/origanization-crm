import { describe, expect, it } from "vitest";
import {
  applyPayment,
  calculateInvoiceTotals,
} from "@/modules/invoices/calculations";

describe("invoice calculations", () => {
  it("calculates subtotal, discount, tax, and total", () => {
    const totals = calculateInvoiceTotals({
      items: [
        { quantity: 1, unitPrice: 4000 },
        { quantity: 1, unitPrice: 4000 },
      ],
      discount: 500,
      tax: 0,
    });

    expect(totals.subtotal).toBe(8000);
    expect(totals.total).toBe(7500);
  });

  it("rejects payments that exceed the invoice total", () => {
    expect(() => applyPayment(0, 8100, 8000)).toThrow(
      /exceed invoice total/i,
    );
  });

  it("marks an invoice paid when the remaining balance is settled", () => {
    const result = applyPayment(3000, 5000, 8000);
    expect(result.status).toBe("PAID");
    expect(result.amountDue).toBe(0);
  });
});
