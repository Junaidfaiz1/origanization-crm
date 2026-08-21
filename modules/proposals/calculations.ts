import { calculateInvoiceTotals, roundMoney } from "@/modules/invoices/calculations";

export type ProposalLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type ProposalTotalsInput = {
  items: ProposalLineInput[];
  discount?: number;
  tax?: number;
};

export function calculateProposalTotals(input: ProposalTotalsInput) {
  const lineItems = input.items.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: roundMoney(item.quantity * item.unitPrice),
  }));

  const totals = calculateInvoiceTotals({
    items: input.items,
    discount: input.discount,
    tax: input.tax,
  });

  return {
    lineItems,
    ...totals,
  };
}
