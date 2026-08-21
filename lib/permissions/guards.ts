import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/errors/app-error";
import { hasPermission, type PermissionKey } from "@/config/permissions";
import type { GraphQLContext } from "@/lib/graphql/context";

export function requireAuth(ctx: GraphQLContext) {
  if (!ctx.userId || !ctx.organizationId) {
    throw new AuthenticationError();
  }

  return {
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    membershipId: ctx.membershipId,
    roleKey: ctx.roleKey,
    permissions: ctx.permissions,
  };
}

export function requirePermission(
  ctx: GraphQLContext,
  permission: PermissionKey,
) {
  const auth = requireAuth(ctx);
  if (!hasPermission(auth.permissions, permission)) {
    throw new AuthorizationError();
  }
  return auth;
}
