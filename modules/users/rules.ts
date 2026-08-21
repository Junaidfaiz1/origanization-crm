import { BusinessRuleError } from "@/lib/errors/app-error";
import {
  SYSTEM_ROLES,
  hasPermission,
  type SystemRoleKey,
} from "@/config/permissions";

export function canManageUsers(permissions: readonly string[]) {
  return (
    hasPermission(permissions, "USER_VIEW") ||
    hasPermission(permissions, "USER_INVITE") ||
    hasPermission(permissions, "USER_UPDATE")
  );
}

/** Roles that can be assigned via invite / role change (OWNER only by an OWNER). */
export const ASSIGNABLE_ROLES = SYSTEM_ROLES.filter(
  (role) => role !== "OWNER",
) as SystemRoleKey[];

export function assertAssignableRole(
  roleKey: string,
  actorRoleKey: string,
): asserts roleKey is SystemRoleKey {
  if (roleKey === "OWNER") {
    if (actorRoleKey !== "OWNER") {
      throw new BusinessRuleError("Only an owner can assign the owner role");
    }
    return;
  }

  if (!ASSIGNABLE_ROLES.includes(roleKey as SystemRoleKey)) {
    throw new BusinessRuleError("Invalid role for this workspace");
  }
}

export function assertCanDemoteOwner(input: {
  currentRoleKey: string | null;
  nextRoleKey: string;
  activeOwnerCount: number;
}) {
  if (input.currentRoleKey !== "OWNER") {
    return;
  }
  if (input.nextRoleKey === "OWNER") {
    return;
  }
  if (input.activeOwnerCount <= 1) {
    throw new BusinessRuleError(
      "Cannot change role: the organization must keep at least one active owner",
    );
  }
}

export function assertCanSuspendOwner(input: {
  roleKey: string | null;
  activeOwnerCount: number;
}) {
  if (input.roleKey !== "OWNER") {
    return;
  }
  if (input.activeOwnerCount <= 1) {
    throw new BusinessRuleError(
      "Cannot suspend the last active owner of the organization",
    );
  }
}
