import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";
import {
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
} from "@/modules/requirements/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const requirementStatusSchema = z.enum(REQUIREMENT_STATUSES);
export const requirementPrioritySchema = z.enum(REQUIREMENT_PRIORITIES);

export const createRequirementSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalText,
  priority: requirementPrioritySchema.optional().default("MEDIUM"),
  status: requirementStatusSchema.optional().default("OPEN"),
});

export const updateRequirementSchema = createRequirementSchema.partial().extend({
  projectId: z.string().trim().min(1, "Project is required").optional(),
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
});

export const requirementListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: requirementStatusSchema.optional(),
  priority: requirementPrioritySchema.optional(),
  projectId: z.string().trim().min(1).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>;
export type UpdateRequirementInput = z.infer<typeof updateRequirementSchema>;
export type RequirementListFilter = z.infer<typeof requirementListFilterSchema>;
