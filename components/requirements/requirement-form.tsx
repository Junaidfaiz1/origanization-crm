"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
} from "@/modules/requirements/rules";
import {
  createRequirementAction,
  updateRequirementAction,
  type RequirementFormState,
} from "@/modules/requirements/actions";
import type { SerializedRequirement } from "@/modules/requirements/service";

const initialState: RequirementFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
  client: { company: { name: string } };
};

type RequirementFormProps = {
  requirement?: SerializedRequirement;
  projects: ProjectOption[];
  defaultProjectId?: string;
};

export function RequirementForm({
  requirement,
  projects,
  defaultProjectId,
}: RequirementFormProps) {
  const action = requirement ? updateRequirementAction : createRequirementAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {requirement ? <input type="hidden" name="id" value={requirement.id} /> : null}
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
            name={requirement ? undefined : "projectId"}
            required={!requirement}
            defaultValue={requirement?.projectId ?? defaultProjectId ?? ""}
            className={selectClassName}
            disabled={Boolean(requirement)}
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
          {requirement ? (
            <input type="hidden" name="projectId" value={requirement.projectId} />
          ) : null}
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
            defaultValue={requirement?.title ?? ""}
            placeholder="Patient portal authentication"
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
            defaultValue={requirement?.description ?? ""}
            className={`${selectClassName} min-h-20 py-2`}
          />
        </FormField>
        <FormField label="Priority" htmlFor="priority" error={state.errors?.priority?.[0]}>
          <select
            id="priority"
            name="priority"
            defaultValue={requirement?.priority ?? "MEDIUM"}
            className={selectClassName}
          >
            {REQUIREMENT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status" htmlFor="status" error={state.errors?.status?.[0]}>
          <select
            id="status"
            name="status"
            defaultValue={requirement?.status ?? "OPEN"}
            className={selectClassName}
          >
            {REQUIREMENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : requirement ? "Save changes" : "Create requirement"}
      </Button>
    </form>
  );
}
