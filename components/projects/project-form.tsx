"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { PROJECT_STATUSES } from "@/modules/projects/rules";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/modules/projects/actions";
import type { SerializedProject } from "@/modules/projects/service";

const initialState: ProjectFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ClientOption = {
  id: string;
  company: { name: string };
};

type OpportunityOption = {
  id: string;
  name: string;
  clientId: string;
};

type ProposalOption = {
  id: string;
  title: string;
  clientId: string;
  opportunityId: string;
};

type ManagerOption = {
  id: string;
  name: string;
  email: string;
};

type ProjectFormProps = {
  project?: SerializedProject;
  clients: ClientOption[];
  opportunities: OpportunityOption[];
  proposals: ProposalOption[];
  managers: ManagerOption[];
  defaultClientId?: string;
  defaultOpportunityId?: string;
  defaultProposalId?: string;
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

export function ProjectForm({
  project,
  clients,
  opportunities,
  proposals,
  managers,
  defaultClientId,
  defaultOpportunityId,
  defaultProposalId,
}: ProjectFormProps) {
  const action = project ? updateProjectAction : createProjectAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const selectedClientId = project?.clientId ?? defaultClientId ?? "";
  const filteredOpportunities = opportunities.filter(
    (row) => !selectedClientId || row.clientId === selectedClientId,
  );
  const filteredProposals = proposals.filter(
    (row) => !selectedClientId || row.clientId === selectedClientId,
  );

  return (
    <form action={formAction} className="space-y-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
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
            defaultValue={selectedClientId}
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
        <FormField
          label="Opportunity"
          htmlFor="opportunityId"
          error={state.errors?.opportunityId?.[0]}
        >
          <select
            id="opportunityId"
            name="opportunityId"
            defaultValue={project?.opportunityId ?? defaultOpportunityId ?? ""}
            className={selectClassName}
          >
            <option value="">None</option>
            {filteredOpportunities.map((opportunity) => (
              <option key={opportunity.id} value={opportunity.id}>
                {opportunity.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Proposal"
          htmlFor="proposalId"
          error={state.errors?.proposalId?.[0]}
        >
          <select
            id="proposalId"
            name="proposalId"
            defaultValue={project?.proposalId ?? defaultProposalId ?? ""}
            className={selectClassName}
            disabled={Boolean(project?.proposalId)}
          >
            <option value="">None</option>
            {filteredProposals.map((proposal) => (
              <option key={proposal.id} value={proposal.id}>
                {proposal.title}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Project name"
          htmlFor="name"
          error={state.errors?.name?.[0]}
          className="sm:col-span-2"
        >
          <Input
            id="name"
            name="name"
            required
            defaultValue={project?.name ?? ""}
            placeholder="Website redesign"
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
            rows={4}
            defaultValue={project?.description ?? ""}
            className={`${selectClassName} min-h-24 py-2`}
          />
        </FormField>
        <FormField label="Budget" htmlFor="budget" error={state.errors?.budget?.[0]}>
          <Input
            id="budget"
            name="budget"
            type="number"
            min="0"
            step="0.01"
            defaultValue={project?.budget ?? ""}
          />
        </FormField>
        <FormField
          label="Estimated cost"
          htmlFor="estimatedCost"
          error={state.errors?.estimatedCost?.[0]}
        >
          <Input
            id="estimatedCost"
            name="estimatedCost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={project?.estimatedCost ?? ""}
          />
        </FormField>
        <FormField
          label="Actual cost"
          htmlFor="actualCost"
          error={state.errors?.actualCost?.[0]}
        >
          <Input
            id="actualCost"
            name="actualCost"
            type="number"
            min="0"
            step="0.01"
            defaultValue={project?.actualCost ?? ""}
          />
        </FormField>
        <FormField label="Status" htmlFor="status" error={state.errors?.status?.[0]}>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? "PLANNING"}
            className={selectClassName}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Start date" htmlFor="startDate" error={state.errors?.startDate?.[0]}>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={formatDateInput(project?.startDate)}
          />
        </FormField>
        <FormField label="End date" htmlFor="endDate" error={state.errors?.endDate?.[0]}>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={formatDateInput(project?.endDate)}
          />
        </FormField>
        <FormField label="Manager" htmlFor="managerId" error={state.errors?.managerId?.[0]}>
          <select
            id="managerId"
            name="managerId"
            defaultValue={project?.managerId ?? ""}
            className={selectClassName}
          >
            <option value="">Unassigned</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} ({manager.email})
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : project ? "Save changes" : "Create project"}
      </Button>
    </form>
  );
}
