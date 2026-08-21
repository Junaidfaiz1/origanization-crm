import { BusinessRuleError } from "@/lib/errors/app-error";
import { assertCanAddNormalTasks } from "@/modules/projects/rules";

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type TaskStatusKey = (typeof TASK_STATUSES)[number];
export type TaskPriorityKey = (typeof TASK_PRIORITIES)[number];

export type ProjectForTask = {
  archivedAt: Date | null;
  status: string;
};

export function assertCanManageTasksOnProject(project: ProjectForTask): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot manage tasks");
  }
  assertCanAddNormalTasks(project.status);
}

export function assertCanCreateTask(project: ProjectForTask): void {
  assertCanManageTasksOnProject(project);
}

export function assertValidMilestoneForTask(
  milestone: { projectId: string } | null,
  projectId: string,
): void {
  if (milestone && milestone.projectId !== projectId) {
    throw new BusinessRuleError("Milestone must belong to the selected project");
  }
}
