"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  createTimeEntryAction,
  updateTimeEntryAction,
  type TimeEntryFormState,
} from "@/modules/time-tracking/actions";
import type { SerializedTimeEntry } from "@/modules/time-tracking/service";

const initialState: TimeEntryFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

type TaskOption = {
  id: string;
  title: string;
  projectId: string;
};

type UserOption = {
  id: string;
  name: string;
  email: string;
};

type TimeEntryFormProps = {
  entry?: SerializedTimeEntry;
  projects: ProjectOption[];
  tasks: TaskOption[];
  users: UserOption[];
  defaultProjectId?: string;
  defaultTaskId?: string;
  canAssignOthers?: boolean;
};

function formatDateTimeInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function TimeEntryForm({
  entry,
  projects,
  tasks,
  users,
  defaultProjectId,
  defaultTaskId,
  canAssignOthers = false,
}: TimeEntryFormProps) {
  const action = entry ? updateTimeEntryAction : createTimeEntryAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedProjectId = entry?.projectId ?? defaultProjectId ?? "";
  const projectTasks = tasks.filter(
    (task) => !selectedProjectId || task.projectId === selectedProjectId,
  );

  return (
    <form action={formAction} className="space-y-4">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {!entry && canAssignOthers && users.length > 0 ? (
          <FormField
            label="Person"
            htmlFor="userId"
            error={state.errors?.userId?.[0]}
            className="sm:col-span-2"
          >
            <select id="userId" name="userId" defaultValue="" className={selectClassName}>
              <option value="">Me</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}
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
            defaultValue={selectedProjectId}
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
        <FormField label="Task" htmlFor="taskId" error={state.errors?.taskId?.[0]}>
          <select
            id="taskId"
            name="taskId"
            defaultValue={entry?.taskId ?? defaultTaskId ?? ""}
            className={selectClassName}
          >
            <option value="">No task</option>
            {projectTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
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
            defaultValue={entry?.hourlyRate ?? ""}
            placeholder="85.00"
          />
        </FormField>
        <FormField label="Start" htmlFor="startedAt" error={state.errors?.startedAt?.[0]}>
          <Input
            id="startedAt"
            name="startedAt"
            type="datetime-local"
            required
            defaultValue={formatDateTimeInput(entry?.startedAt) || formatDateTimeInput(new Date())}
          />
        </FormField>
        <FormField label="End" htmlFor="endedAt" error={state.errors?.endedAt?.[0]}>
          <Input
            id="endedAt"
            name="endedAt"
            type="datetime-local"
            defaultValue={formatDateTimeInput(entry?.endedAt)}
          />
        </FormField>
        <FormField label="Billable" htmlFor="billable" className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              id="billable"
              name="billable"
              type="checkbox"
              defaultChecked={entry?.billable ?? true}
              className="rounded border-input"
            />
            Billable to client
          </label>
        </FormField>
        <FormField
          label="Notes"
          htmlFor="notes"
          error={state.errors?.notes?.[0]}
          className="sm:col-span-2"
        >
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={entry?.notes ?? ""}
            placeholder="Implemented auth middleware and tests…"
            className={`${selectClassName} min-h-20 py-2 placeholder:text-muted-foreground`}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : entry ? "Save changes" : "Log time"}
      </Button>
    </form>
  );
}
