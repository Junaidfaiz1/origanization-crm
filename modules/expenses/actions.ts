"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/modules/expenses/validation";
import {
  createExpense,
  deleteExpense,
  updateExpense,
  updateExpenseStatus,
} from "@/modules/expenses/service";
import { logger } from "@/lib/logging/logger";

export type ExpenseFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function expenseFields(formData: FormData) {
  return {
    projectId: formValue(formData, "projectId"),
    category: formValue(formData, "category"),
    description: formValue(formData, "description"),
    amount: formValue(formData, "amount"),
    currency: formValue(formData, "currency"),
    date: formValue(formData, "date"),
  };
}

function revalidateExpensePaths(projectId: string, expenseId?: string) {
  revalidatePath("/expenses");
  revalidatePath(`/projects/${projectId}`);
  if (expenseId) {
    revalidatePath(`/expenses/${expenseId}`);
  }
}

export async function createExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  let actor;
  try {
    actor = await requirePagePermission("EXPENSE_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createExpenseSchema.safeParse(expenseFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const expense = await createExpense(actor, parsed.data);
    revalidateExpensePaths(expense.projectId, expense.id);
    redirect(`/expenses/${expense.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Create expense failed", { operation: "expense.create", error });
    return { message: "Unable to submit this expense. Try again." };
  }
}

export async function updateExpenseAction(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  let actor;
  try {
    actor = await requirePagePermission("EXPENSE_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Expense id is required." };

  const parsed = updateExpenseSchema.safeParse(expenseFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const expense = await updateExpense(actor, id, parsed.data);
    revalidateExpensePaths(expense.projectId, expense.id);
    redirect(`/expenses/${expense.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update expense failed", { operation: "expense.update", error });
    return { message: "Unable to update this expense. Try again." };
  }
}

export async function approveExpenseAction(formData: FormData) {
  const actor = await requirePagePermission("EXPENSE_UPDATE");
  const id = formValue(formData, "id");
  const expense = await updateExpenseStatus(actor, id, { status: "APPROVED" });
  revalidateExpensePaths(expense.projectId, expense.id);
  redirect(`/expenses/${expense.id}`);
}

export async function rejectExpenseAction(formData: FormData) {
  const actor = await requirePagePermission("EXPENSE_UPDATE");
  const id = formValue(formData, "id");
  const expense = await updateExpenseStatus(actor, id, { status: "REJECTED" });
  revalidateExpensePaths(expense.projectId, expense.id);
  redirect(`/expenses/${expense.id}`);
}

export async function deleteExpenseAction(formData: FormData) {
  const actor = await requirePagePermission("EXPENSE_CREATE");
  const id = formValue(formData, "id");
  const expense = await deleteExpense(actor, id);
  revalidateExpensePaths(expense.projectId);
  redirect("/expenses");
}
