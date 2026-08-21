import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";

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

const optionalUserId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(""));

const optionalTaskId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(""));

export const createTimeEntrySchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  taskId: optionalTaskId,
  userId: optionalUserId,
  startedAt: z.string().trim().min(1, "Start time is required"),
  endedAt: z.string().trim().optional(),
  hourlyRate: optionalRate,
  billable: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true" || value === "on"),
  notes: optionalText,
});

export const updateTimeEntrySchema = createTimeEntrySchema.partial().extend({
  projectId: z.string().trim().min(1, "Project is required").optional(),
  startedAt: z.string().trim().min(1, "Start time is required").optional(),
});

export const startTimerSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  taskId: optionalTaskId,
  billable: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value !== false && value !== "false"),
  notes: optionalText,
});

export const timeEntryListFilterSchema = z.object({
  search: z.string().trim().optional(),
  projectId: z.string().trim().min(1).optional(),
  taskId: z.string().trim().min(1).optional(),
  userId: z.string().trim().min(1).optional(),
  billable: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (value === true || value === "true") return true;
      if (value === false || value === "false") return false;
      return undefined;
    }),
  runningOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true"),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type StartTimerInput = z.infer<typeof startTimerSchema>;
export type TimeEntryListFilter = z.infer<typeof timeEntryListFilterSchema>;
