import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  inviteUserSchema,
  memberListFilterSchema,
  updateMemberRoleSchema,
} from "@/modules/users/validation";
import {
  getOrgMember,
  inviteUser,
  listAssignableRoles,
  listOrgMembers,
  resendInvite,
  suspendMember,
  updateMemberRole,
} from "@/modules/users/service";

async function run<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw formatGraphQLError(error, requestId);
  }
}

function parse<T>(
  schema: {
    safeParse: (
      data: unknown,
    ) =>
      | { success: true; data: T }
      | {
          success: false;
          error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } };
        };
  },
  data: unknown,
): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ValidationError(
      "Validation failed",
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }
  return parsed.data;
}

export const usersResolvers = {
  Query: {
    workspaceMember: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "USER_VIEW");
        return getOrgMember(actor, args.id);
      }),
    workspaceMembers: async (
      _parent: unknown,
      args: {
        filter?: { search?: string; status?: string };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "USER_VIEW");
        const filter = parse(memberListFilterSchema, {
          search: args.filter?.search,
          status: args.filter?.status,
          after: args.after,
          first: args.first,
        });
        return listOrgMembers(actor, filter);
      }),
    assignableRoles: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        requirePermission(ctx, "USER_VIEW");
        return listAssignableRoles();
      }),
  },
  Mutation: {
    inviteUser: async (
      _parent: unknown,
      args: { input: { name: string; email: string; roleKey: string } },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "USER_INVITE");
        const input = parse(inviteUserSchema, args.input);
        return inviteUser(
          {
            userId: actor.userId,
            organizationId: actor.organizationId,
            roleKey: actor.roleKey,
          },
          input,
        );
      }),
    updateMemberRole: async (
      _parent: unknown,
      args: { id: string; input: { roleKey: string } },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "USER_UPDATE");
        const input = parse(updateMemberRoleSchema, {
          membershipId: args.id,
          roleKey: args.input.roleKey,
        });
        return updateMemberRole(
          {
            userId: actor.userId,
            organizationId: actor.organizationId,
            roleKey: actor.roleKey,
          },
          input,
        );
      }),
    suspendMember: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "USER_DELETE");
        return suspendMember(
          {
            userId: actor.userId,
            organizationId: actor.organizationId,
            roleKey: actor.roleKey,
          },
          { membershipId: args.id },
        );
      }),
    resendInvite: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "USER_INVITE");
        return resendInvite(
          {
            userId: actor.userId,
            organizationId: actor.organizationId,
            roleKey: actor.roleKey,
          },
          args.id,
        );
      }),
  },
};
