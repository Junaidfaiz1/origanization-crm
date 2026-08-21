import { BusinessRuleError } from "@/lib/errors/app-error";
import { assertCanAddNormalTasks } from "@/modules/projects/rules";

export type ProjectForTimeEntry = {
  archivedAt: Date | null;
  status: string;
};

export function assertCanLogTimeOnProject(project: ProjectForTimeEntry): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot receive time entries");
  }
  assertCanAddNormalTasks(project.status);
}

export function assertValidTaskForTimeEntry(
  task: { projectId: string } | null,
  projectId: string,
): void {
  if (task && task.projectId !== projectId) {
    throw new BusinessRuleError("Task must belong to the selected project");
  }
}

export function computeDurationSeconds(startedAt: Date, endedAt: Date): number {
  const seconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
  if (seconds <= 0) {
    throw new BusinessRuleError("End time must be after start time");
  }
  return seconds;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) {
    return "—";
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function isTimeEntryRunning(entry: { endedAt: Date | null }): boolean {
  return entry.endedAt == null;
}
