import { z } from "zod";
import { CONTRACT_STATUSES } from "@/modules/contracts/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const contractStatusSchema = z.enum(CONTRACT_STATUSES);

export const createContractSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  resourceId: optionalId,
  bidId: optionalId,
  title: z.string().trim().min(1, "Title is required"),
  content: optionalText,
  totalAmount: z.string().trim().min(1, "Amount is required"),
  currency: z.string().trim().min(1).optional().default("USD"),
  startDate: optionalText,
  endDate: optionalText,
});

export const updateContractSchema = createContractSchema.partial().extend({
  projectId: z.string().trim().min(1, "Project is required").optional(),
  title: z.string().trim().min(1, "Title is required").optional(),
  totalAmount: z.string().trim().min(1, "Amount is required").optional(),
});

export const updateContractStatusSchema = z.object({
  status: contractStatusSchema,
});

export const contractListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: contractStatusSchema.optional(),
  projectId: z.string().trim().min(1).optional(),
  clientId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type UpdateContractStatusInput = z.infer<typeof updateContractStatusSchema>;
export type ContractListFilter = z.infer<typeof contractListFilterSchema>;
