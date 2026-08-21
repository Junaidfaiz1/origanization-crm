import { z } from "zod";
import {
  BID_REQUEST_STATUSES,
  BID_REQUEST_TYPES,
  BID_STATUSES,
} from "@/modules/bidding/rules";

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

export const bidRequestStatusSchema = z.enum(BID_REQUEST_STATUSES);
export const bidRequestTypeSchema = z.enum(BID_REQUEST_TYPES);
export const bidStatusSchema = z.enum(BID_STATUSES);

export const createBidRequestSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalText,
  budgetMin: optionalMoney,
  budgetMax: optionalMoney,
  currency: z.string().trim().min(1).max(8).optional().default("USD"),
  deadline: optionalDate,
  biddingType: bidRequestTypeSchema.optional().default("EXTERNAL"),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const updateBidRequestSchema = createBidRequestSchema.partial().extend({
  projectId: z.string().trim().min(1, "Project is required").optional(),
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
});

export const bidRequestListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: bidRequestStatusSchema.optional(),
  projectId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const submitBidSchema = z.object({
  bidRequestId: z.string().trim().min(1, "Bid request is required"),
  amount: z.string().trim().min(1, "Amount is required"),
  estimatedDays: z.coerce.number().int().min(1, "Estimated days must be at least 1"),
  proposal: optionalText,
});

export const updateBidSchema = z.object({
  amount: z.string().trim().min(1).optional(),
  estimatedDays: z.coerce.number().int().min(1).optional(),
  proposal: optionalText,
});

export const negotiateBidSchema = z.object({
  amount: z.string().trim().min(1, "Amount is required"),
  estimatedDays: z.coerce.number().int().min(1, "Estimated days must be at least 1"),
  message: optionalText,
});

export const bidListFilterSchema = z.object({
  bidRequestId: z.string().trim().min(1).optional(),
  status: bidStatusSchema.optional(),
  mineOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true"),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateBidRequestInput = z.infer<typeof createBidRequestSchema>;
export type UpdateBidRequestInput = z.infer<typeof updateBidRequestSchema>;
export type BidRequestListFilter = z.infer<typeof bidRequestListFilterSchema>;
export type SubmitBidInput = z.infer<typeof submitBidSchema>;
export type UpdateBidInput = z.infer<typeof updateBidSchema>;
export type NegotiateBidInput = z.infer<typeof negotiateBidSchema>;
export type BidListFilter = z.infer<typeof bidListFilterSchema>;
