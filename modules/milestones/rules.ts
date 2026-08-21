import { BusinessRuleError } from "@/lib/errors/app-error";
import { isProjectClosed } from "@/modules/projects/rules";

export const MILESTONE_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
  "BLOCKED",
] as const;

export type MilestoneStatusKey = (typeof MILESTONE_STATUSES)[number];

export type ProjectForMilestone = {
  archivedAt: Date | null;
  status: string;
};

export function assertCanManageMilestones(project: ProjectForMilestone): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot manage milestones");
  }
  if (isProjectClosed(project.status)) {
    throw new BusinessRuleError(
      "Completed, closed, or cancelled projects cannot manage milestones without reopening",
    );
  }
}

export function assertCanDeleteMilestone(taskCount: number): void {
  if (taskCount > 0) {
    throw new BusinessRuleError(
      "Remove or reassign linked tasks before deleting this milestone",
    );
  }
}
