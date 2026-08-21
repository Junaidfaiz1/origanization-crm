import { z } from "zod";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/modules/tasks/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalHours = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const taskStatusSchema = z.enum(TASK_STATUSES);
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

export const createTaskSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  milestoneId: z.string().trim().min(1).optional().or(z.literal("")),
  assignedToId: z.string().trim().min(1).optional().or(z.literal("")),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optionalText,
  priority: taskPrioritySchema.optional().default("MEDIUM"),
  status: taskStatusSchema.optional().default("TODO"),
  dueDate: optionalDate,
  estimatedHours: optionalHours,
  actualHours: optionalHours,
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  projectId: z.string().trim().min(1, "Project is required").optional(),
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
});

export const taskListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  projectId: z.string().trim().min(1).optional(),
  milestoneId: z.string().trim().min(1).optional(),
  assignedToId: z.string().trim().min(1).optional(),
  mineOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true"),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type TaskListFilter = z.infer<typeof taskListFilterSchema>;
