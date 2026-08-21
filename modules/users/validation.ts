import { z } from "zod";
import { SYSTEM_ROLES } from "@/config/permissions";

const roleKeySchema = z.enum(SYSTEM_ROLES);

export const inviteUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  roleKey: roleKeySchema,
});

export const updateMemberRoleSchema = z.object({
  membershipId: z.string().trim().min(1, "Member is required"),
  roleKey: roleKeySchema,
});

export const suspendMemberSchema = z.object({
  membershipId: z.string().trim().min(1, "Member is required"),
});

export const memberListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]).optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(50),
  after: z.string().trim().optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type SuspendMemberInput = z.infer<typeof suspendMemberSchema>;
export type MemberListFilter = z.infer<typeof memberListFilterSchema>;
