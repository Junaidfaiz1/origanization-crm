"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { AVAILABILITY_STATUSES, RESOURCE_TYPES } from "@/modules/resources/rules";
import {
  createResourceAction,
  updateResourceAction,
  type ResourceFormState,
} from "@/modules/resources/actions";
import type { SerializedResource } from "@/modules/resources/service";

const initialState: ResourceFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type MemberOption = {
  id: string;
  name: string;
  email: string;
};

type SkillOption = {
  id: string;
  name: string;
};

type ResourceFormProps = {
  resource?: SerializedResource;
  members: MemberOption[];
  skills: SkillOption[];
};

export function ResourceForm({ resource, members, skills }: ResourceFormProps) {
  const action = resource ? updateResourceAction : createResourceAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedSkillIds = new Set(resource?.skills.map((skill) => skill.id) ?? []);

  return (
    <form action={formAction} className="space-y-4">
      {resource ? <input type="hidden" name="id" value={resource.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {!resource ? (
          <FormField
            label="Team member"
            htmlFor="userId"
            error={state.errors?.userId?.[0]}
            className="sm:col-span-2"
          >
            <select id="userId" name="userId" required className={selectClassName} defaultValue="">
              <option value="" disabled>
                Select member
              </option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.email}
                </option>
              ))}
            </select>
          </FormField>
        ) : (
          <FormField label="Team member" htmlFor="resource-member" className="sm:col-span-2">
            <p id="resource-member" className="text-sm">
              {resource.user.name} · {resource.user.email}
            </p>
          </FormField>
        )}
        <FormField label="Type" htmlFor="type" error={state.errors?.type?.[0]}>
          <select
            id="type"
            name="type"
            required
            defaultValue={resource?.type ?? "FREELANCER"}
            className={selectClassName}
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Availability"
          htmlFor="availabilityStatus"
          error={state.errors?.availabilityStatus?.[0]}
        >
          <select
            id="availabilityStatus"
            name="availabilityStatus"
            defaultValue={resource?.availabilityStatus ?? "AVAILABLE"}
            className={selectClassName}
          >
            {AVAILABILITY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Hourly rate" htmlFor="hourlyRate" error={state.errors?.hourlyRate?.[0]}>
          <Input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={resource?.hourlyRate ?? ""}
            placeholder="85.00"
          />
        </FormField>
        <FormField
          label="Experience (years)"
          htmlFor="experienceYears"
          error={state.errors?.experienceYears?.[0]}
        >
          <Input
            id="experienceYears"
            name="experienceYears"
            type="number"
            min="0"
            max="60"
            defaultValue={resource?.experienceYears ?? ""}
            placeholder="5"
          />
        </FormField>
        <FormField label="Rating" htmlFor="rating" error={state.errors?.rating?.[0]}>
          <Input
            id="rating"
            name="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            defaultValue={resource?.rating ?? ""}
            placeholder="4.5"
          />
        </FormField>
        <FormField label="Bio" htmlFor="bio" error={state.errors?.bio?.[0]} className="sm:col-span-2">
          <textarea
            id="bio"
            name="bio"
            rows={3}
            defaultValue={resource?.bio ?? ""}
            placeholder="Full-stack engineer focused on Next.js and PostgreSQL…"
            className={`${selectClassName} min-h-20 py-2 placeholder:text-muted-foreground`}
          />
        </FormField>
        <FormField label="Skills" htmlFor="resource-skills" className="sm:col-span-2">
          <div id="resource-skills" className="grid gap-2 sm:grid-cols-2">
            {skills.map((skill) => (
              <label key={skill.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="skillIds"
                  value={skill.id}
                  defaultChecked={selectedSkillIds.has(skill.id)}
                  className="rounded border-input"
                />
                {skill.name}
              </label>
            ))}
          </div>
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : resource ? "Save changes" : "Create resource"}
      </Button>
    </form>
  );
}
