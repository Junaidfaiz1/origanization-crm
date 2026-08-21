import { BusinessRuleError } from "@/lib/errors/app-error";

export const EXPENSE_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export const EXPENSE_CATEGORIES = [
  "Software",
  "Travel",
  "Equipment",
  "Subcontractor",
  "Meals",
  "Other",
] as const;

export type ExpenseStatusKey = (typeof EXPENSE_STATUSES)[number];
export type ExpenseCategoryKey = (typeof EXPENSE_CATEGORIES)[number];

export type ProjectForExpense = {
  archivedAt: Date | null;
};

export function assertCanSubmitExpenseOnProject(project: ProjectForExpense): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot receive new expenses");
  }
}

export function assertCanEditExpense(status: string): void {
  if (status !== "PENDING") {
    throw new BusinessRuleError("Only pending expenses can be edited");
  }
}

export function assertCanReviewExpense(status: string): void {
  if (status !== "PENDING") {
    throw new BusinessRuleError("Only pending expenses can be approved or rejected");
  }
}

export function assertCanDeleteExpense(status: string): void {
  if (status === "APPROVED") {
    throw new BusinessRuleError("Approved expenses cannot be deleted");
  }
}
