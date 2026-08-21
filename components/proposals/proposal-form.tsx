"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { MoneyDisplay } from "@/components/shared/money-display";
import { calculateProposalTotals } from "@/modules/proposals/calculations";
import {
  createProposalAction,
  updateProposalAction,
  type ProposalFormState,
} from "@/modules/proposals/actions";
import type { SerializedProposal } from "@/modules/proposals/service";

const initialState: ProposalFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type OpportunityOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

type LineItem = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type ProposalFormProps = {
  proposal?: SerializedProposal;
  opportunities: OpportunityOption[];
  defaultOpportunityId?: string;
};

function initialItems(proposal?: SerializedProposal): LineItem[] {
  if (proposal?.items.length) {
    return proposal.items.map((item) => ({
      description: item.description,
      quantity: item.quantity ?? "1",
      unitPrice: item.unitPrice ?? "0",
    }));
  }
  return [{ description: "", quantity: "1", unitPrice: "" }];
}

export function ProposalForm({
  proposal,
  opportunities,
  defaultOpportunityId,
}: ProposalFormProps) {
  const action = proposal ? updateProposalAction : createProposalAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [items, setItems] = useState<LineItem[]>(() => initialItems(proposal));
  const [discount, setDiscount] = useState(proposal?.discount ?? "0");
  const [tax, setTax] = useState(proposal?.tax ?? "0");

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

    return calculateProposalTotals({
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
      {proposal ? <input type="hidden" name="id" value={proposal.id} /> : null}
      <input type="hidden" name="itemsJson" value={itemsJson} />
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Opportunity"
          htmlFor="opportunityId"
          error={state.errors?.opportunityId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="opportunityId"
            name="opportunityId"
            required
            defaultValue={proposal?.opportunityId ?? defaultOpportunityId ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Select an opportunity
            </option>
            {opportunities.map((opportunity) => (
              <option key={opportunity.id} value={opportunity.id}>
                {opportunity.name} · {opportunity.client.company.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Title" htmlFor="title" error={state.errors?.title?.[0]} className="sm:col-span-2">
          <Input id="title" name="title" required defaultValue={proposal?.title ?? ""} />
        </FormField>
        <FormField label="Currency" htmlFor="currency" error={state.errors?.currency?.[0]}>
          <Input id="currency" name="currency" defaultValue={proposal?.currency ?? "USD"} maxLength={3} />
        </FormField>
        <FormField label="Valid until" htmlFor="validUntil" error={state.errors?.validUntil?.[0]}>
          <Input
            id="validUntil"
            name="validUntil"
            type="date"
            defaultValue={
              proposal?.validUntil
                ? new Date(proposal.validUntil).toISOString().slice(0, 10)
                : ""
            }
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
          label="Description"
          htmlFor="description"
          error={state.errors?.description?.[0]}
          className="sm:col-span-2"
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={proposal?.description ?? ""}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
              setItems((current) => [...current, { description: "", quantity: "1", unitPrice: "" }])
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
            <div key={index} className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_6rem_8rem_auto]">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(event) =>
                  setItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, description: event.target.value } : row,
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
                      rowIndex === index ? { ...row, quantity: event.target.value } : row,
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
                      rowIndex === index ? { ...row, unitPrice: event.target.value } : row,
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
                onClick={() => setItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}
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
              <MoneyDisplay amount={totals.total} currency={proposal?.currency ?? "USD"} />
            </span>
          </div>
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : proposal ? "Save proposal" : "Create proposal"}
      </Button>
    </form>
  );
}
