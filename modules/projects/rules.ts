import { BusinessRuleError } from "@/lib/errors/app-error";

export const PROJECT_STATUSES = [
  "PLANNING",
  "BIDDING",
  "RESOURCE_ASSIGNED",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
  "CANCELLED",
  "CLOSED",
] as const;

export type ProjectStatusKey = (typeof PROJECT_STATUSES)[number];

export const ACTIVE_PROJECT_STATUSES = PROJECT_STATUSES.filter(
  (status) => status !== "COMPLETED" && status !== "CANCELLED" && status !== "CLOSED",
);

export const CLOSED_PROJECT_STATUSES = ["COMPLETED", "CLOSED", "CANCELLED"] as const;

export type EditableProject = {
  archivedAt: Date | null;
};

export function isProjectClosed(status: string): boolean {
  return (CLOSED_PROJECT_STATUSES as readonly string[]).includes(status);
}

export function assertCanEditProject(project: EditableProject): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot be edited");
  }
}

export function assertCanArchiveProject(project: EditableProject): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("This project is already archived");
  }
}

export function assertCanAddNormalTasks(status: string): void {
  if (isProjectClosed(status)) {
    throw new BusinessRuleError(
      "Completed, closed, or cancelled projects cannot receive new tasks without reopening",
    );
  }
}
