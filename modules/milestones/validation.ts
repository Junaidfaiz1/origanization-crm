import { z } from "zod";
import { MILESTONE_STATUSES } from "@/modules/milestones/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalMoney = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const milestoneStatusSchema = z.enum(MILESTONE_STATUSES);

export const createMilestoneSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: optionalText,
  amount: optionalMoney,
  dueDate: optionalDate,
  status: milestoneStatusSchema.optional().default("PENDING"),
  order: z.coerce.number().int().min(0).max(10_000).optional().default(0),
});

export const updateMilestoneSchema = createMilestoneSchema.partial().extend({
  projectId: z.string().trim().min(1, "Project is required").optional(),
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
});

export const milestoneListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: milestoneStatusSchema.optional(),
  projectId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;
export type MilestoneListFilter = z.infer<typeof milestoneListFilterSchema>;
