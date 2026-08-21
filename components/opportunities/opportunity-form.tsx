"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { OPPORTUNITY_STAGES } from "@/modules/opportunities/rules";
import {
  createOpportunityAction,
  updateOpportunityAction,
  type OpportunityFormState,
} from "@/modules/opportunities/actions";
import type { SerializedOpportunity } from "@/modules/opportunities/service";

const initialState: OpportunityFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ClientOption = {
  id: string;
  company: { name: string };
};

type AssigneeOption = {
  id: string;
  name: string;
  email: string;
};

type OpportunityFormProps = {
  opportunity?: SerializedOpportunity;
  clients: ClientOption[];
  assignees: AssigneeOption[];
  defaultClientId?: string;
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

export function OpportunityForm({
  opportunity,
  clients,
  assignees,
  defaultClientId,
}: OpportunityFormProps) {
  const action = opportunity ? updateOpportunityAction : createOpportunityAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {opportunity ? <input type="hidden" name="id" value={opportunity.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Client"
          htmlFor="clientId"
          error={state.errors?.clientId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="clientId"
            name="clientId"
            required
            defaultValue={opportunity?.clientId ?? defaultClientId ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Deal name" htmlFor="name" error={state.errors?.name?.[0]} className="sm:col-span-2">
          <Input id="name" name="name" required defaultValue={opportunity?.name ?? ""} />
        </FormField>
        <FormField
          label="Estimated value"
          htmlFor="estimatedValue"
          error={state.errors?.estimatedValue?.[0]}
        >
          <Input
            id="estimatedValue"
            name="estimatedValue"
            type="number"
            min="0"
            step="0.01"
            defaultValue={opportunity?.estimatedValue ?? ""}
          />
        </FormField>
        <FormField label="Probability (%)" htmlFor="probability" error={state.errors?.probability?.[0]}>
          <Input
            id="probability"
            name="probability"
            type="number"
            min="0"
            max="100"
            defaultValue={opportunity?.probability ?? 0}
          />
        </FormField>
        <FormField label="Stage" htmlFor="stage" error={state.errors?.stage?.[0]}>
          <select
            id="stage"
            name="stage"
            defaultValue={opportunity?.stage ?? "NEW"}
            className={selectClassName}
          >
            {OPPORTUNITY_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Expected close"
          htmlFor="expectedCloseDate"
          error={state.errors?.expectedCloseDate?.[0]}
        >
          <Input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            defaultValue={formatDateInput(opportunity?.expectedCloseDate)}
          />
        </FormField>
        <FormField label="Assignee" htmlFor="assignedToId" error={state.errors?.assignedToId?.[0]}>
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue={opportunity?.assignedToId ?? ""}
            className={selectClassName}
          >
            <option value="">Unassigned</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
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
            rows={4}
            defaultValue={opportunity?.description ?? ""}
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : opportunity ? "Save opportunity" : "Create opportunity"}
      </Button>
    </form>
  );
}
