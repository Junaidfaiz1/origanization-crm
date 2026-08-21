import { BusinessRuleError } from "@/lib/errors/app-error";
import { isProjectClosed } from "@/modules/projects/rules";

export const REQUIREMENT_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;

export const REQUIREMENT_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export type RequirementStatusKey = (typeof REQUIREMENT_STATUSES)[number];
export type RequirementPriorityKey = (typeof REQUIREMENT_PRIORITIES)[number];

export type ProjectForRequirement = {
  archivedAt: Date | null;
  status: string;
};

export function assertCanManageRequirements(project: ProjectForRequirement): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot manage requirements");
  }
  if (isProjectClosed(project.status)) {
    throw new BusinessRuleError(
      "Completed, closed, or cancelled projects cannot manage requirements without reopening",
    );
  }
}
