import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";
import { PROJECT_STATUSES } from "@/modules/projects/rules";
import { PROGRESS_HEALTH } from "@/modules/progress/rules";

export const progressListFilterSchema = z.object({
  search: z.string().trim().optional(),
  health: z.enum(PROGRESS_HEALTH).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ProgressListFilter = z.infer<typeof progressListFilterSchema>;
