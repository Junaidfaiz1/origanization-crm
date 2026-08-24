"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/modules/tasks/rules";
import {
  createTaskAction,
  updateTaskAction,
  type TaskFormState,
} from "@/modules/tasks/actions";
import type { SerializedTask } from "@/modules/tasks/service";

const initialState: TaskFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

type MilestoneOption = {
  id: string;
  name: string;
  projectId: string;
};

type AssigneeOption = {
  id: string;
  name: string;
  email: string;
};

type TaskFormProps = {
  task?: SerializedTask;
  projects: ProjectOption[];
  milestones: MilestoneOption[];
  assignees: AssigneeOption[];
  defaultProjectId?: string;
  canEditProject?: boolean;
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

export function TaskForm({
  task,
  projects,
  milestones,
  assignees,
  defaultProjectId,
  canEditProject = true,
}: TaskFormProps) {
  const action = task ? updateTaskAction : createTaskAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedProjectId = task?.projectId ?? defaultProjectId ?? "";
  const projectMilestones = milestones.filter(
    (milestone) => !selectedProjectId || milestone.projectId === selectedProjectId,
  );

  return (
    <form action={formAction} className="space-y-4">
      {task ? <input type="hidden" name="id" value={task.id} /> : null}
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
            name={task && !canEditProject ? undefined : "projectId"}
            required={!task}
            defaultValue={selectedProjectId}
            className={selectClassName}
            disabled={Boolean(task) && !canEditProject}
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
          {task && !canEditProject ? (
            <input type="hidden" name="projectId" value={task.projectId} />
          ) : null}
        </FormField>
        <FormField
          label="Milestone"
          htmlFor="milestoneId"
          error={state.errors?.milestoneId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="milestoneId"
            name="milestoneId"
            defaultValue={task?.milestoneId ?? ""}
            className={selectClassName}
          >
            <option value="">No milestone</option>
            {projectMilestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
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
            defaultValue={task?.title ?? ""}
            placeholder="Implement dashboard filters"
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
            defaultValue={task?.description ?? ""}
            placeholder="Acceptance criteria and notes…"
            className={`${selectClassName} min-h-20 py-2 placeholder:text-muted-foreground`}
          />
        </FormField>
        <FormField label="Assignee" htmlFor="assignedToId" error={state.errors?.assignedToId?.[0]}>
          <select
            id="assignedToId"
            name="assignedToId"
            defaultValue={task?.assignedToId ?? ""}
            className={selectClassName}
          >
            <option value="">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Due date" htmlFor="dueDate" error={state.errors?.dueDate?.[0]}>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={formatDateInput(task?.dueDate)}
          />
        </FormField>
        <FormField label="Priority" htmlFor="priority" error={state.errors?.priority?.[0]}>
          <select
            id="priority"
            name="priority"
            defaultValue={task?.priority ?? "MEDIUM"}
            className={selectClassName}
          >
            {TASK_PRIORITIES.map((priority) => (
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
            defaultValue={task?.status ?? "TODO"}
            className={selectClassName}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label="Estimated hours"
          htmlFor="estimatedHours"
          error={state.errors?.estimatedHours?.[0]}
        >
          <Input
            id="estimatedHours"
            name="estimatedHours"
            type="number"
            min="0"
            step="0.25"
            defaultValue={task?.estimatedHours ?? ""}
            placeholder="8"
          />
        </FormField>
        <FormField label="Actual hours" htmlFor="actualHours" error={state.errors?.actualHours?.[0]}>
          <Input
            id="actualHours"
            name="actualHours"
            type="number"
            min="0"
            step="0.25"
            defaultValue={task?.actualHours ?? ""}
            placeholder="0"
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : task ? "Save changes" : "Create task"}
      </Button>
    </form>
  );
}
