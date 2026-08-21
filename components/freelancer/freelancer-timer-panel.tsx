"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/shared/form-field";
import {
  startFreelancerTimerAction,
  stopFreelancerTimerAction,
} from "@/modules/freelancer-portal/actions";
import type { SerializedTimeEntry } from "@/modules/time-tracking/service";
import { formatDuration } from "@/modules/time-tracking/rules";
import { DateDisplay } from "@/components/shared/date-display";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = { id: string; name: string };
type TaskOption = { id: string; title: string; projectId: string };

export function FreelancerTimerPanel({
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
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium">Timer running</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeEntry.project.name}
          {activeEntry.task ? ` · ${activeEntry.task.title}` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Started <DateDisplay value={activeEntry.startedAt} /> ·{" "}
          {formatDuration(activeEntry.durationSeconds)}
        </p>
        <form action={stopFreelancerTimerAction} className="mt-3">
          <input type="hidden" name="id" value={activeEntry.id} />
          <Button type="submit" variant="outline">
            Stop timer
          </Button>
        </form>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Start a timer once you have an assigned task on an active project.
      </div>
    );
  }

  return (
    <form
      action={startFreelancerTimerAction}
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <p className="text-sm font-medium">Start timer</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Project" htmlFor="projectId">
          <select id="projectId" name="projectId" required className={selectClassName}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Task" htmlFor="taskId">
          <select id="taskId" name="taskId" className={selectClassName}>
            <option value="">Optional</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <Button type="submit">Start</Button>
    </form>
  );
}
