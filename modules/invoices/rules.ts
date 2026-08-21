import { BusinessRuleError } from "@/lib/errors/app-error";

export const INVOICE_STATUSES = [
  "DRAFT",
  "SENT",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
] as const;

export type InvoiceStatusKey = (typeof INVOICE_STATUSES)[number];

export const EDITABLE_INVOICE_STATUSES = ["DRAFT"] as const;

export type InvoiceActionContext = {
  status: InvoiceStatusKey | string;
  itemCount?: number;
  amountPaid?: number;
};

export function assertCanEditInvoice(invoice: InvoiceActionContext): void {
  if (
    !EDITABLE_INVOICE_STATUSES.includes(
      invoice.status as (typeof EDITABLE_INVOICE_STATUSES)[number],
    )
  ) {
    throw new BusinessRuleError("Only draft invoices can be edited");
  }
}

export function assertCanDeleteInvoice(invoice: InvoiceActionContext): void {
  if (invoice.status !== "DRAFT") {
    throw new BusinessRuleError("Only draft invoices can be deleted");
  }
  if ((invoice.amountPaid ?? 0) > 0) {
    throw new BusinessRuleError("Invoices with payments cannot be deleted");
  }
}

export function assertCanSendInvoice(invoice: InvoiceActionContext): void {
  if (invoice.status !== "DRAFT") {
    throw new BusinessRuleError("Only draft invoices can be sent");
  }
  if (!invoice.itemCount || invoice.itemCount < 1) {
    throw new BusinessRuleError("Add at least one line item before sending");
  }
}

export function assertCanCancelInvoice(invoice: InvoiceActionContext): void {
  if (invoice.status === "CANCELLED") {
    throw new BusinessRuleError("This invoice is already cancelled");
  }
  if (invoice.status === "PAID") {
    throw new BusinessRuleError("Paid invoices cannot be cancelled");
  }
  if ((invoice.amountPaid ?? 0) > 0) {
    throw new BusinessRuleError("Invoices with payments cannot be cancelled");
  }
}

export function assertCanMarkOverdue(invoice: {
  status: string;
  dueDate: Date | null;
}): void {
  if (invoice.status !== "SENT" && invoice.status !== "PARTIALLY_PAID") {
    throw new BusinessRuleError("Only sent invoices can be marked overdue");
  }
  if (!invoice.dueDate) {
    throw new BusinessRuleError("Set a due date before marking overdue");
  }
  if (invoice.dueDate >= new Date()) {
    throw new BusinessRuleError("Invoice is not past its due date");
  }
}

export function assertClientMatchesProject(
  projectClientId: string,
  clientId: string,
): void {
  if (projectClientId !== clientId) {
    throw new BusinessRuleError("Client must match the selected project");
  }
}
