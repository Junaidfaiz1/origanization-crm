"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { PAYMENT_METHODS } from "@/modules/payments/rules";
import {
  recordPaymentAction,
  type PaymentFormState,
} from "@/modules/payments/actions";

const initialState: PaymentFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type InvoiceOption = {
  id: string;
  invoiceNumber: string;
  amountDue: { toString(): string } | string;
  currency: string;
  client: { company: { name: string } };
};

type PaymentFormProps = {
  invoices: InvoiceOption[];
  defaultInvoiceId?: string;
};

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function PaymentForm({ invoices, defaultInvoiceId }: PaymentFormProps) {
  const [state, formAction, pending] = useActionState(recordPaymentAction, initialState);
  const selected =
    invoices.find((invoice) => invoice.id === defaultInvoiceId) ?? invoices[0];

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Invoice"
          htmlFor="invoiceId"
          error={state.errors?.invoiceId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="invoiceId"
            name="invoiceId"
            required
            defaultValue={defaultInvoiceId ?? selected?.id ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Select invoice
            </option>
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.invoiceNumber} · {invoice.client.company.name} · due{" "}
                {typeof invoice.amountDue === "string"
                  ? invoice.amountDue
                  : invoice.amountDue.toString()}{" "}
                {invoice.currency}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Amount" htmlFor="amount" error={state.errors?.amount?.[0]}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={
              selected
                ? typeof selected.amountDue === "string"
                  ? selected.amountDue
                  : selected.amountDue.toString()
                : ""
            }
          />
        </FormField>
        <FormField label="Currency" htmlFor="currency" error={state.errors?.currency?.[0]}>
          <Input
            id="currency"
            name="currency"
            defaultValue={selected?.currency ?? "USD"}
            maxLength={3}
          />
        </FormField>
        <FormField label="Method" htmlFor="method" error={state.errors?.method?.[0]}>
          <select
            id="method"
            name="method"
            required
            defaultValue="BANK_TRANSFER"
            className={selectClassName}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Paid date" htmlFor="paidAt" error={state.errors?.paidAt?.[0]}>
          <Input
            id="paidAt"
            name="paidAt"
            type="date"
            required
            defaultValue={formatDateInput(new Date())}
          />
        </FormField>
        <FormField
          label="Reference"
          htmlFor="reference"
          error={state.errors?.reference?.[0]}
          className="sm:col-span-2"
        >
          <Input
            id="reference"
            name="reference"
            placeholder="Bank txn / cheque number (optional)"
          />
        </FormField>
        <FormField
          label="Notes"
          htmlFor="notes"
          error={state.errors?.notes?.[0]}
          className="sm:col-span-2"
        >
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Optional note about how payment was received"
            className={`${selectClassName} min-h-20 py-2`}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Record payment"}
      </Button>
    </form>
  );
}
