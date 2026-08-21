import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";
import { AVAILABILITY_STATUSES, RESOURCE_TYPES } from "@/modules/resources/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalRate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalRating = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const resourceTypeSchema = z.enum(RESOURCE_TYPES);
export const availabilityStatusSchema = z.enum(AVAILABILITY_STATUSES);

export const createResourceSchema = z.object({
  userId: z.string().trim().min(1, "Team member is required"),
  type: resourceTypeSchema,
  hourlyRate: optionalRate,
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  bio: optionalText,
  availabilityStatus: availabilityStatusSchema.optional().default("AVAILABLE"),
  rating: optionalRating,
  skillIds: z.array(z.string().trim().min(1)).optional().default([]),
});

export const updateResourceSchema = createResourceSchema
  .omit({ userId: true })
  .partial()
  .extend({
    type: resourceTypeSchema.optional(),
    skillIds: z.array(z.string().trim().min(1)).optional(),
  });

export const resourceListFilterSchema = z.object({
  search: z.string().trim().optional(),
  type: resourceTypeSchema.optional(),
  availabilityStatus: availabilityStatusSchema.optional(),
  skillId: z.string().trim().min(1).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type ResourceListFilter = z.infer<typeof resourceListFilterSchema>;
