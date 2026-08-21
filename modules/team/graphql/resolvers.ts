import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { hasPermission } from "@/config/permissions";
import { ValidationError } from "@/lib/errors/app-error";
import {
  assignTeamMemberSchema,
  teamListFilterSchema,
  updateTeamMemberSchema,
} from "@/modules/team/validation";
import {
  assignTeamMember,
  getTeamMember,
  getTeamSummary,
  listTeamMembers,
  removeTeamMember,
  updateTeamMember,
  type SerializedTeamMember,
} from "@/modules/team/service";

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

function redactRates(
  member: SerializedTeamMember,
  permissions: readonly string[],
): SerializedTeamMember {
  if (hasPermission(permissions, "RESOURCE_VIEW")) {
    return member;
  }
  return {
    ...member,
    resource: {
      ...member.resource,
      hourlyRate: null,
    },
  };
}

export const teamResolvers = {
  Query: {
    teamMember: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        const member = await getTeamMember(actor, args.id);
        return redactRates(member, actor.permissions);
      }),
    teamMembers: async (
      _parent: unknown,
      args: {
        filter?: {
          search?: string;
          projectId?: string;
          resourceId?: string;
          type?: string;
        };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        const filter = parse(teamListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listTeamMembers(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.assignedAt, node.id),
            node: redactRates(node, actor.permissions),
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    teamSummary: async (
      _parent: unknown,
      args: { projectId?: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        return getTeamSummary(actor, args.projectId);
      }),
  },
  Mutation: {
    assignTeamMember: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_UPDATE");
        const input = parse(assignTeamMemberSchema, args.input);
        const member = await assignTeamMember(actor, input);
        return redactRates(member, actor.permissions);
      }),
    updateTeamMember: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_UPDATE");
        const input = parse(updateTeamMemberSchema, args.input);
        const member = await updateTeamMember(actor, args.id, input);
        return redactRates(member, actor.permissions);
      }),
    removeTeamMember: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_UPDATE");
        const member = await removeTeamMember(actor, args.id);
        return redactRates(member, actor.permissions);
      }),
  },
};
