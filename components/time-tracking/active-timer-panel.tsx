"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import { startTimerAction, stopTimerAction } from "@/modules/time-tracking/actions";
import type { SerializedTimeEntry } from "@/modules/time-tracking/service";
import { formatDuration } from "@/modules/time-tracking/rules";
import { DateDisplay } from "@/components/shared/date-display";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-800 dark:text-amber-200">
          Timer running
        </p>
        <p className="mt-2 text-lg font-semibold">{activeEntry.project.name}</p>
        <p className="text-sm text-muted-foreground">
          Started <DateDisplay value={activeEntry.startedAt} />
          {activeEntry.task ? ` · ${activeEntry.task.title}` : ""}
        </p>
        <form action={stopTimerAction} className="mt-4">
          <input type="hidden" name="id" value={activeEntry.id} />
          <Button type="submit">Stop timer</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Start a timer</p>
      <form action={startTimerAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <FormField label="Project" htmlFor="timer-projectId">
          <select id="timer-projectId" name="projectId" required className={selectClassName}>
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
          <select id="timer-taskId" name="taskId" className={selectClassName} defaultValue="">
            <option value="">No task</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes" htmlFor="timer-notes" className="sm:col-span-2">
          <input id="timer-notes" name="notes" className={selectClassName} placeholder="Optional" />
        </FormField>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input name="billable" type="checkbox" defaultChecked className="rounded border-input" />
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
