import { z } from "zod";
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES } from "@/modules/expenses/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const expenseStatusSchema = z.enum(EXPENSE_STATUSES);
export const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

export const createExpenseSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  category: expenseCategorySchema,
  description: optionalText,
  amount: z.string().trim().min(1, "Amount is required"),
  currency: z.string().trim().min(1).optional().default("USD"),
  date: z.string().trim().min(1, "Date is required"),
});

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  projectId: z.string().trim().min(1, "Project is required").optional(),
  category: expenseCategorySchema.optional(),
  amount: z.string().trim().min(1, "Amount is required").optional(),
});

export const updateExpenseStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const expenseListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: expenseStatusSchema.optional(),
  projectId: z.string().trim().min(1).optional(),
  category: expenseCategorySchema.optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>;
export type ExpenseListFilter = z.infer<typeof expenseListFilterSchema>;
