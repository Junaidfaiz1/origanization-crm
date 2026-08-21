export type InvoiceTotalsInput = {
  items: Array<{ quantity: number; unitPrice: number }>;
  discount?: number;
  tax?: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

export function calculateInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotals {
  const subtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  const discount = input.discount ?? 0;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = input.tax ?? 0;
  const total = taxable + tax;

  return {
    subtotal: roundMoney(subtotal),
    discount: roundMoney(discount),
    tax: roundMoney(tax),
    total: roundMoney(total),
  };
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function applyPayment(
  amountPaid: number,
  paymentAmount: number,
  total: number,
): { amountPaid: number; amountDue: number; status: "PARTIALLY_PAID" | "PAID" } {
  const nextPaid = roundMoney(amountPaid + paymentAmount);
  if (nextPaid > total) {
    throw new Error("Payment would exceed invoice total");
  }

  return {
    amountPaid: nextPaid,
    amountDue: roundMoney(total - nextPaid),
    status: nextPaid === total ? "PAID" : "PARTIALLY_PAID",
  };
}
