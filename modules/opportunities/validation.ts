import { z } from "zod";
import { OPPORTUNITY_STAGES } from "@/modules/opportunities/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const opportunityStageSchema = z.enum(OPPORTUNITY_STAGES);

export const createOpportunitySchema = z.object({
  clientId: z.string().trim().min(1, "Client is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: optionalText,
  estimatedValue: z.coerce.number().min(0, "Estimated value cannot be negative").optional(),
  probability: z.coerce
    .number()
    .int()
    .min(0, "Probability must be between 0 and 100")
    .max(100, "Probability must be between 0 and 100")
    .optional()
    .default(0),
  expectedCloseDate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  stage: opportunityStageSchema.optional().default("NEW"),
  assignedToId: z.string().trim().min(1).optional().or(z.literal("")),
});

export const updateOpportunitySchema = createOpportunitySchema.partial().extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  clientId: z.string().trim().min(1, "Client is required").optional(),
});

export const opportunityListFilterSchema = z.object({
  search: z.string().trim().optional(),
  stage: opportunityStageSchema.optional(),
  clientId: z.string().trim().min(1).optional(),
  assignedToId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type OpportunityListFilter = z.infer<typeof opportunityListFilterSchema>;
