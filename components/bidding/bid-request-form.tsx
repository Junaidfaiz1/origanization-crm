"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { BID_REQUEST_TYPES } from "@/modules/bidding/rules";
import {
  createBidRequestAction,
  updateBidRequestAction,
  type BiddingFormState,
} from "@/modules/bidding/actions";
import type { SerializedBidRequest } from "@/modules/bidding/service";

const initialState: BiddingFormState = {};
const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function BidRequestForm({
  request,
  projects,
  defaultProjectId,
}: {
  request?: SerializedBidRequest;
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const action = request ? updateBidRequestAction : createBidRequestAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {request ? <input type="hidden" name="id" value={request.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="projectId" error={state.errors?.projectId?.[0]} className="sm:col-span-2">
          <select
            id="projectId"
            name="projectId"
            required
            defaultValue={request?.projectId ?? defaultProjectId ?? ""}
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
        <FormField label="Title" htmlFor="title" error={state.errors?.title?.[0]} className="sm:col-span-2">
          <Input
            id="title"
            name="title"
            required
            defaultValue={request?.title ?? ""}
            placeholder="Frontend implementation — Phase 2"
          />
        </FormField>
        <FormField label="Description" htmlFor="description" error={state.errors?.description?.[0]} className="sm:col-span-2">
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={request?.description ?? ""}
            placeholder="Scope, tech stack, and acceptance criteria…"
            className={`${selectClassName} min-h-24 py-2 placeholder:text-muted-foreground`}
          />
        </FormField>
        <FormField label="Budget min" htmlFor="budgetMin" error={state.errors?.budgetMin?.[0]}>
          <Input
            id="budgetMin"
            name="budgetMin"
            type="number"
            min="0"
            step="0.01"
            defaultValue={request?.budgetMin ?? ""}
            placeholder="2000"
          />
        </FormField>
        <FormField label="Budget max" htmlFor="budgetMax" error={state.errors?.budgetMax?.[0]}>
          <Input
            id="budgetMax"
            name="budgetMax"
            type="number"
            min="0"
            step="0.01"
            defaultValue={request?.budgetMax ?? ""}
            placeholder="5000"
          />
        </FormField>
        <FormField label="Currency" htmlFor="currency" error={state.errors?.currency?.[0]}>
          <Input
            id="currency"
            name="currency"
            defaultValue={request?.currency ?? "USD"}
            placeholder="USD"
          />
        </FormField>
        <FormField label="Type" htmlFor="biddingType" error={state.errors?.biddingType?.[0]}>
          <select id="biddingType" name="biddingType" defaultValue={request?.biddingType ?? "EXTERNAL"} className={selectClassName}>
            {BID_REQUEST_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Deadline" htmlFor="deadline" error={state.errors?.deadline?.[0]}>
          <Input id="deadline" name="deadline" type="date" defaultValue={formatDateInput(request?.deadline)} />
        </FormField>
        <FormField label="Ends at" htmlFor="endsAt" error={state.errors?.endsAt?.[0]}>
          <Input id="endsAt" name="endsAt" type="date" defaultValue={formatDateInput(request?.endsAt)} />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : request ? "Save changes" : "Create bid request"}
      </Button>
    </form>
  );
}
