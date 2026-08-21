import { z } from "zod";
import { LEAD_STATUSES } from "@/modules/leads/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const leadStatusSchema = z.enum(LEAD_STATUSES);

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: optionalText,
  companyName: optionalText,
  source: optionalText,
  estimatedValue: z.coerce.number().positive("Estimated value must be positive").optional(),
  status: leadStatusSchema.optional().default("NEW"),
  assignedToId: z.string().trim().min(1).optional().or(z.literal("")),
  notes: optionalText,
});

export const updateLeadSchema = createLeadSchema.partial().extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
});

export const leadListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: leadStatusSchema.optional(),
  assignedToId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadListFilter = z.infer<typeof leadListFilterSchema>;
