"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { LEAD_STATUSES } from "@/modules/leads/rules";
import {
  createLeadAction,
  updateLeadAction,
  type LeadFormState,
} from "@/modules/leads/actions";
import type { SerializedLead } from "@/modules/leads/service";

const initialState: LeadFormState = {};

type AssigneeOption = { id: string; name: string; email: string };

type LeadFormProps = {
  lead?: SerializedLead;
  assignees: AssigneeOption[];
};

export function LeadForm({ lead, assignees }: LeadFormProps) {
  const action = lead ? updateLeadAction : createLeadAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {lead ? <input type="hidden" name="id" value={lead.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="name" error={state.errors?.name?.[0]}>
          <Input id="name" name="name" required defaultValue={lead?.name ?? ""} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={state.errors?.email?.[0]}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={lead?.email ?? ""}
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={state.errors?.phone?.[0]}>
          <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
        </FormField>
        <FormField
          label="Company"
          htmlFor="companyName"
          error={state.errors?.companyName?.[0]}
        >
          <Input
            id="companyName"
            name="companyName"
            defaultValue={lead?.companyName ?? ""}
          />
        </FormField>
        <FormField label="Source" htmlFor="source" error={state.errors?.source?.[0]}>
          <Input id="source" name="source" defaultValue={lead?.source ?? ""} />
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
            defaultValue={lead?.estimatedValue ?? ""}
          />
        </FormField>
        <FormField label="Status" htmlFor="status" error={state.errors?.status?.[0]}>
          <select
            id="status"
            name="status"
            defaultValue={lead?.status ?? "NEW"}
            className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-base md:h-10 md:text-sm"
          >
            {LEAD_STATUSES.filter((status) => status !== "CONVERTED").map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
            {lead?.status === "CONVERTED" ? (
              <option value="CONVERTED">CONVERTED</option>
            ) : null}
          </select>
        </FormField>
        <FormField
          label="Assignee"
          htmlFor="assignedToId"
          error={state.errors?.assignedToId?.[0]}
        >
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue={lead?.assignedToId ?? ""}
            className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-base md:h-10 md:text-sm"
          >
            <option value="">Unassigned</option>
            {assignees.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Notes" htmlFor="notes" error={state.errors?.notes?.[0]}>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={lead?.notes ?? ""}
          className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-base md:text-sm"
        />
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : lead ? "Save lead" : "Create lead"}
      </Button>
    </form>
  );
}
