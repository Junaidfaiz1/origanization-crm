import { z } from "zod";
import { PROJECT_ACTIVITY_ENTITY_TYPES } from "@/modules/activity/rules";

export const activityEntityTypeSchema = z.enum(PROJECT_ACTIVITY_ENTITY_TYPES);

export const activityListFilterSchema = z.object({
  search: z.string().trim().optional(),
  projectId: z.string().trim().min(1).optional(),
  entityType: activityEntityTypeSchema.optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ActivityListFilter = z.infer<typeof activityListFilterSchema>;
