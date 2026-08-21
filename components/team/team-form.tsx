"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  assignTeamMemberAction,
  updateTeamMemberAction,
  type TeamFormState,
} from "@/modules/team/actions";
import type { SerializedTeamMember } from "@/modules/team/service";

const initialState: TeamFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  status: string;
  client: { company: { name: string } };
};

type ResourceOption = {
  id: string;
  type: string;
  availabilityStatus: string;
  user: { id: string; name: string; email: string };
};

type TeamFormProps = {
  member?: SerializedTeamMember;
  projects: ProjectOption[];
  resources: ResourceOption[];
  defaultProjectId?: string;
};

export function TeamForm({
  member,
  projects,
  resources,
  defaultProjectId,
}: TeamFormProps) {
  const action = member ? updateTeamMemberAction : assignTeamMemberAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  if (member) {
    return (
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={member.id} />
        {state.message ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
            {state.message}
          </p>
        ) : null}
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <p className="font-medium">{member.resource.user.name}</p>
          <p className="text-muted-foreground">
            {member.project.name} · {member.resource.type.replaceAll("_", " ")}
          </p>
        </div>
        <FormField label="Role on project" htmlFor="role" error={state.errors?.role?.[0]}>
          <Input
            id="role"
            name="role"
            defaultValue={member.role ?? ""}
            placeholder="Lead developer"
            maxLength={120}
          />
        </FormField>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save role"}
        </Button>
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
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
            defaultValue={defaultProjectId ?? ""}
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
          label="Resource"
          htmlFor="resourceId"
          error={state.errors?.resourceId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="resourceId"
            name="resourceId"
            required
            defaultValue=""
            className={selectClassName}
          >
            <option value="" disabled>
              Select resource
            </option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.user.name} · {resource.type.replaceAll("_", " ")} ·{" "}
                {resource.availabilityStatus.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Role on project"
          htmlFor="role"
          error={state.errors?.role?.[0]}
          className="sm:col-span-2"
        >
          <Input
            id="role"
            name="role"
            defaultValue=""
            placeholder="Lead developer"
            maxLength={120}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending || resources.length === 0}>
        {pending ? "Assigning…" : "Assign to project"}
      </Button>
      {resources.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No unassigned resources available for this project.
        </p>
      ) : null}
    </form>
  );
}
