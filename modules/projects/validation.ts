import { z } from "zod";
import { PROJECT_STATUSES } from "@/modules/projects/rules";

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

export const projectStatusSchema = z.enum(PROJECT_STATUSES);

export const createProjectSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required"),
  opportunityId: z.string().trim().min(1).optional().or(z.literal("")),
  proposalId: z.string().trim().min(1).optional().or(z.literal("")),
  name: z.string().trim().min(1, "Name is required").max(200),
  description: optionalText,
  budget: optionalMoney,
  estimatedCost: optionalMoney,
  actualCost: optionalMoney,
  startDate: optionalDate,
  endDate: optionalDate,
  status: projectStatusSchema.optional().default("PLANNING"),
  managerId: z.string().trim().min(1).optional().or(z.literal("")),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  clientId: z.string().trim().min(1, "Client is required").optional(),
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
});

export const projectListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: projectStatusSchema.optional(),
  clientId: z.string().trim().min(1).optional(),
  managerId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectListFilter = z.infer<typeof projectListFilterSchema>;
