"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { startTimerAction, stopTimerAction } from "@/modules/time-tracking/actions";
import type { SerializedTimeEntry } from "@/modules/time-tracking/service";
import { formatDuration } from "@/modules/time-tracking/rules";
import { DateDisplay } from "@/components/shared/date-display";
import { Timer } from "lucide-react";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

type ProjectOption = {
  id: string;
  name: string;
};

type TaskOption = {
  id: string;
  title: string;
  projectId: string;
};

export function ActiveTimerPanel({
  activeEntry,
  projects,
  tasks,
  canCreate,
}: {
  activeEntry: SerializedTimeEntry | null;
  projects: ProjectOption[];
  tasks: TaskOption[];
  canCreate: boolean;
}) {
  if (!canCreate) {
    return null;
  }

  if (activeEntry) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-warning/20 text-warning">
            <Timer className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-caption font-medium uppercase tracking-wide text-warning">
              Timer running
            </p>
            <p className="mt-1 text-h4">{activeEntry.project.name}</p>
            <p className="text-sm text-muted-foreground">
              Started <DateDisplay value={activeEntry.startedAt} />
              {activeEntry.task ? ` · ${activeEntry.task.title}` : ""}
            </p>
            <form action={stopTimerAction} className="mt-4">
              <input type="hidden" name="id" value={activeEntry.id} />
              <Button type="submit" variant="destructive">
                Stop timer
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">Start a timer</p>
      </div>
      <form action={startTimerAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <FormField label="Project" htmlFor="timer-projectId" required>
          <select
            id="timer-projectId"
            name="projectId"
            required
            className={selectClassName}
          >
            <option value="" disabled>
              Select project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Task" htmlFor="timer-taskId">
          <select
            id="timer-taskId"
            name="taskId"
            className={selectClassName}
            defaultValue=""
          >
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes" htmlFor="timer-notes" className="sm:col-span-2">
          <input
            id="timer-notes"
            name="notes"
            className={`${selectClassName} placeholder:text-muted-foreground`}
            placeholder="Working on API integration"
          />
        </FormField>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              name="billable"
              type="checkbox"
              defaultChecked
              className="rounded border-input"
            />
            Billable
          </label>
        </div>
        <Button type="submit" className="sm:col-span-2">
          Start timer
        </Button>
      </form>
    </div>
  );
}

export function DurationDisplay({ seconds }: { seconds: number | null }) {
  return <span>{formatDuration(seconds)}</span>;
}
