import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";
import { PROPOSAL_STATUSES } from "@/modules/proposals/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const proposalStatusSchema = z.enum(PROPOSAL_STATUSES);

export const proposalItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
});

export const createProposalSchema = z.object({
  opportunityId: z.string().trim().min(1, "Opportunity is required"),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: optionalText,
  discount: z.coerce.number().min(0, "Discount cannot be negative").optional().default(0),
  tax: z.coerce.number().min(0, "Tax cannot be negative").optional().default(0),
  currency: z.string().trim().min(3).max(3).optional().default("USD"),
  validUntil: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  items: z.array(proposalItemSchema).min(1, "Add at least one line item"),
});

export const updateProposalSchema = createProposalSchema.partial().extend({
  title: z.string().trim().min(2, "Title must be at least 2 characters").optional(),
  opportunityId: z.string().trim().min(1, "Opportunity is required").optional(),
  items: z.array(proposalItemSchema).min(1, "Add at least one line item").optional(),
});

export const proposalListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: proposalStatusSchema.optional(),
  clientId: z.string().trim().min(1).optional(),
  opportunityId: z.string().trim().min(1).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ProposalItemInput = z.infer<typeof proposalItemSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
export type ProposalListFilter = z.infer<typeof proposalListFilterSchema>;
