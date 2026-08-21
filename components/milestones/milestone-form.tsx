"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { MILESTONE_STATUSES } from "@/modules/milestones/rules";
import {
  createMilestoneAction,
  updateMilestoneAction,
  type MilestoneFormState,
} from "@/modules/milestones/actions";
import type { SerializedMilestone } from "@/modules/milestones/service";

const initialState: MilestoneFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
  client: { company: { name: string } };
};

type MilestoneFormProps = {
  milestone?: SerializedMilestone;
  projects: ProjectOption[];
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

export function MilestoneForm({
  milestone,
  projects,
  defaultProjectId,
}: MilestoneFormProps) {
  const action = milestone ? updateMilestoneAction : createMilestoneAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {milestone ? <input type="hidden" name="id" value={milestone.id} /> : null}
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
            name={milestone ? undefined : "projectId"}
            required={!milestone}
            defaultValue={milestone?.projectId ?? defaultProjectId ?? ""}
            className={selectClassName}
            disabled={Boolean(milestone)}
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
          {milestone ? (
            <input type="hidden" name="projectId" value={milestone.projectId} />
          ) : null}
        </FormField>
        <FormField
          label="Name"
          htmlFor="name"
          error={state.errors?.name?.[0]}
          className="sm:col-span-2"
        >
          <Input
            id="name"
            name="name"
            required
            defaultValue={milestone?.name ?? ""}
            placeholder="UI/UX delivery"
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
            defaultValue={milestone?.description ?? ""}
            className={`${selectClassName} min-h-20 py-2`}
          />
        </FormField>
        <FormField label="Amount" htmlFor="amount" error={state.errors?.amount?.[0]}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={milestone?.amount ?? ""}
          />
        </FormField>
        <FormField label="Due date" htmlFor="dueDate" error={state.errors?.dueDate?.[0]}>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={formatDateInput(milestone?.dueDate)}
          />
        </FormField>
        <FormField label="Status" htmlFor="status" error={state.errors?.status?.[0]}>
          <select
            id="status"
            name="status"
            defaultValue={milestone?.status ?? "PENDING"}
            className={selectClassName}
          >
            {MILESTONE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Order" htmlFor="order" error={state.errors?.order?.[0]}>
          <Input
            id="order"
            name="order"
            type="number"
            min="0"
            step="1"
            defaultValue={milestone?.order ?? 0}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : milestone ? "Save changes" : "Create milestone"}
      </Button>
    </form>
  );
}
