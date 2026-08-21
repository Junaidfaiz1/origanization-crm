import { BusinessRuleError } from "@/lib/errors/app-error";

export const PAYMENT_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export type PaymentStatusKey = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "BANK_TRANSFER",
  "CASH",
  "CHEQUE",
  "OTHER",
] as const;
export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number];

export const PAYABLE_INVOICE_STATUSES = [
  "SENT",
  "PARTIALLY_PAID",
  "OVERDUE",
] as const;

export type PayableInvoice = {
  status: string;
  amountDue: number;
  total: number;
  amountPaid: number;
};

export function assertCanRecordPaymentOnInvoice(invoice: PayableInvoice): void {
  if (
    !PAYABLE_INVOICE_STATUSES.includes(
      invoice.status as (typeof PAYABLE_INVOICE_STATUSES)[number],
    )
  ) {
    throw new BusinessRuleError(
      "Payments can only be recorded on sent, partially paid, or overdue invoices",
    );
  }
  if (invoice.amountDue <= 0) {
    throw new BusinessRuleError("This invoice has no remaining balance");
  }
}

export function assertPaymentAmount(amount: number, amountDue: number): void {
  if (amount <= 0) {
    throw new BusinessRuleError("Payment amount must be greater than zero");
  }
  if (amount > amountDue) {
    throw new BusinessRuleError("Payment cannot exceed the remaining amount due");
  }
}

export function assertCanVoidPayment(payment: {
  status: string;
}): void {
  if (payment.status !== "SUCCEEDED") {
    throw new BusinessRuleError("Only succeeded payments can be voided");
  }
}
