"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { MoneyDisplay } from "@/components/shared/money-display";
import { calculateInvoiceTotals } from "@/modules/invoices/calculations";
import {
  createInvoiceAction,
  updateInvoiceAction,
  type InvoiceFormState,
} from "@/modules/invoices/actions";
import type { SerializedInvoice } from "@/modules/invoices/service";

const initialState: InvoiceFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ClientOption = {
  id: string;
  company: { name: string };
};

type ProjectOption = {
  id: string;
  name: string;
  clientId: string;
  client: { company: { name: string } };
};

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type InvoiceFormProps = {
  invoice?: SerializedInvoice;
  clients: ClientOption[];
  projects: ProjectOption[];
  defaultClientId?: string;
  defaultProjectId?: string;
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

function initialItems(invoice?: SerializedInvoice): LineItem[] {
  if (invoice?.items.length) {
    return invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity ?? "1",
      unitPrice: item.unitPrice ?? "0",
    }));
  }
  return [{ description: "", quantity: "1", unitPrice: "" }];
}

export function InvoiceForm({
  invoice,
  clients,
  projects,
  defaultClientId,
  defaultProjectId,
}: InvoiceFormProps) {
  const action = invoice ? updateInvoiceAction : createInvoiceAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [items, setItems] = useState<LineItem[]>(() => initialItems(invoice));
  const [discount, setDiscount] = useState(invoice?.discount ?? "0");
  const [tax, setTax] = useState(invoice?.tax ?? "0");
  const [clientId, setClientId] = useState(
    invoice?.clientId ?? defaultClientId ?? "",
  );

  const filteredProjects = projects.filter(
    (project) => !clientId || project.clientId === clientId,
  );

  const totals = useMemo(() => {
    const parsedItems = items
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      .filter((item) => item.quantity > 0);

    if (parsedItems.length === 0) {
      return null;
    }

    return calculateInvoiceTotals({
      items: parsedItems,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
    });
  }, [items, discount, tax]);

  const itemsJson = JSON.stringify(
    items
      .filter((item) => item.description.trim())
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      .filter((item) => item.quantity > 0 && item.description),
  );

  return (
    <form action={formAction} className="space-y-6">
      {invoice ? <input type="hidden" name="id" value={invoice.id} /> : null}
      <input type="hidden" name="itemsJson" value={itemsJson} />
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Client" htmlFor="clientId" error={state.errors?.clientId?.[0]}>
          <select
            id="clientId"
            name="clientId"
            required
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className={selectClassName}
          >
            <option value="" disabled>
              Select client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Project" htmlFor="projectId" error={state.errors?.projectId?.[0]}>
          <select
            id="projectId"
            name="projectId"
            defaultValue={invoice?.projectId ?? defaultProjectId ?? ""}
            className={selectClassName}
          >
            <option value="">No project</option>
            {filteredProjects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Issue date" htmlFor="issueDate" error={state.errors?.issueDate?.[0]}>
          <Input
            id="issueDate"
            name="issueDate"
            type="date"
            required
            defaultValue={
              formatDateInput(invoice?.issueDate) || formatDateInput(new Date())
            }
          />
        </FormField>
        <FormField label="Due date" htmlFor="dueDate" error={state.errors?.dueDate?.[0]}>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={formatDateInput(invoice?.dueDate)}
          />
        </FormField>
        <FormField label="Currency" htmlFor="currency" error={state.errors?.currency?.[0]}>
          <Input
            id="currency"
            name="currency"
            defaultValue={invoice?.currency ?? "USD"}
            maxLength={3}
          />
        </FormField>
        <FormField label="Discount" htmlFor="discount" error={state.errors?.discount?.[0]}>
          <Input
            id="discount"
            name="discount"
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(event) => setDiscount(event.target.value)}
          />
        </FormField>
        <FormField label="Tax" htmlFor="tax" error={state.errors?.tax?.[0]}>
          <Input
            id="tax"
            name="tax"
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(event) => setTax(event.target.value)}
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
            defaultValue={invoice?.notes ?? ""}
            className={`${selectClassName} min-h-20 py-2`}
          />
        </FormField>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Line items</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setItems((current) => [
                ...current,
                { description: "", quantity: "1", unitPrice: "" },
              ])
            }
          >
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </div>
        {state.errors?.items?.[0] ? (
          <p className="text-sm text-destructive">{state.errors.items[0]}</p>
        ) : null}
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_6rem_8rem_auto]"
            >
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, description: event.target.value }
                        : row,
                    ),
                  )
                }
              />
              <Input
                placeholder="Qty"
                type="number"
                min="0"
                step="0.01"
                value={item.quantity}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, quantity: event.target.value }
                        : row,
                    ),
                  )
                }
              />
              <Input
                placeholder="Unit price"
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, unitPrice: event.target.value }
                        : row,
                    ),
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Remove item"
                disabled={items.length === 1}
                onClick={() =>
                  setItems((current) =>
                    current.filter((_, rowIndex) => rowIndex !== index),
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {totals ? (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <MoneyDisplay amount={totals.subtotal} />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <MoneyDisplay amount={totals.discount} />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <MoneyDisplay amount={totals.tax} />
          </div>
          <div className="mt-2 flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">
              <MoneyDisplay amount={totals.total} currency={invoice?.currency ?? "USD"} />
            </span>
          </div>
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : invoice ? "Save changes" : "Create invoice"}
      </Button>
    </form>
  );
}
