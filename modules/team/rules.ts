import { BusinessRuleError } from "@/lib/errors/app-error";
import { isProjectClosed } from "@/modules/projects/rules";

export type ProjectForTeam = {
  archivedAt: Date | null;
  status: string;
};

export function assertCanManageTeam(project: ProjectForTeam): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot manage team assignments");
  }
  if (isProjectClosed(project.status)) {
    throw new BusinessRuleError(
      "Completed, closed, or cancelled projects cannot change team without reopening",
    );
  }
}

export function shouldMarkResourceAssigned(status: string): boolean {
  return status === "PLANNING" || status === "BIDDING";
}
