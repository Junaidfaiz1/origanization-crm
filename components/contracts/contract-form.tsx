"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  createContractAction,
  updateContractAction,
  type ContractFormState,
} from "@/modules/contracts/actions";
import type { SerializedContract } from "@/modules/contracts/service";

const initialState: ContractFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  clientId: string;
  client: { company: { name: string } };
};

type ResourceOption = {
  id: string;
  user: { name: string; email: string };
};

type BidOption = {
  id: string;
  amount: { toString(): string } | string;
  status: string;
  resource: { user: { name: string } } | null;
};

type ContractFormProps = {
  contract?: SerializedContract;
  projects: ProjectOption[];
  resources: ResourceOption[];
  bids?: BidOption[];
  defaultProjectId?: string;
  defaultBidId?: string;
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

export function ContractForm({
  contract,
  projects,
  resources,
  bids = [],
  defaultProjectId,
  defaultBidId,
}: ContractFormProps) {
  const action = contract ? updateContractAction : createContractAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {contract ? <input type="hidden" name="id" value={contract.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Project"
          htmlFor="projectId"
          error={state.errors?.projectId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="projectId"
            name="projectId"
            required
            defaultValue={contract?.projectId ?? defaultProjectId ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Select project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} · {project.client.company.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Title"
          htmlFor="title"
          error={state.errors?.title?.[0]}
          className="sm:col-span-2"
        >
          <Input
            id="title"
            name="title"
            required
            defaultValue={contract?.title ?? ""}
            placeholder="Freelance development agreement"
          />
        </FormField>
        <FormField label="Resource" htmlFor="resourceId" error={state.errors?.resourceId?.[0]}>
          <select
            id="resourceId"
            name="resourceId"
            defaultValue={contract?.resourceId ?? ""}
            className={selectClassName}
          >
            <option value="">No resource linked</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.user.name} · {resource.user.email}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Linked bid" htmlFor="bidId" error={state.errors?.bidId?.[0]}>
          <select
            id="bidId"
            name="bidId"
            defaultValue={contract?.bidId ?? defaultBidId ?? ""}
            className={selectClassName}
          >
            <option value="">No bid linked</option>
            {bids.map((bid) => (
              <option key={bid.id} value={bid.id}>
                {typeof bid.amount === "string" ? bid.amount : bid.amount.toString()} ·{" "}
                {bid.resource?.user.name ?? "Bidder"} · {bid.status.toLowerCase()}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Amount" htmlFor="totalAmount" error={state.errors?.totalAmount?.[0]}>
          <Input
            id="totalAmount"
            name="totalAmount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={contract?.totalAmount ?? ""}
          />
        </FormField>
        <FormField label="Currency" htmlFor="currency" error={state.errors?.currency?.[0]}>
          <Input id="currency" name="currency" defaultValue={contract?.currency ?? "USD"} />
        </FormField>
        <FormField label="Start date" htmlFor="startDate" error={state.errors?.startDate?.[0]}>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={formatDateInput(contract?.startDate)}
          />
        </FormField>
        <FormField label="End date" htmlFor="endDate" error={state.errors?.endDate?.[0]}>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={formatDateInput(contract?.endDate)}
          />
        </FormField>
        <FormField
          label="Contract content"
          htmlFor="content"
          error={state.errors?.content?.[0]}
          className="sm:col-span-2"
        >
          <textarea
            id="content"
            name="content"
            rows={8}
            defaultValue={contract?.content ?? ""}
            placeholder="Scope, payment terms, and deliverables…"
            className={`${selectClassName} min-h-40 py-2 font-mono text-xs`}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : contract ? "Save changes" : "Create contract"}
      </Button>
    </form>
  );
}
