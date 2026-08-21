import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const assignTeamMemberSchema = z.object({
  projectId: z.string().trim().min(1, "Project is required"),
  resourceId: z.string().trim().min(1, "Resource is required"),
  role: optionalText,
});

export const updateTeamMemberSchema = z.object({
  role: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value ?? ""),
});

export const teamListFilterSchema = z.object({
  search: z.string().trim().optional(),
  projectId: z.string().trim().min(1).optional(),
  resourceId: z.string().trim().min(1).optional(),
  type: z.enum(["EMPLOYEE", "FREELANCER"]).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type AssignTeamMemberInput = z.infer<typeof assignTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type TeamListFilter = z.infer<typeof teamListFilterSchema>;
