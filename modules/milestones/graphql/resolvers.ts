import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createMilestoneSchema,
  milestoneListFilterSchema,
  updateMilestoneSchema,
} from "@/modules/milestones/validation";
import {
  createMilestone,
  deleteMilestone,
  getMilestone,
  getMilestoneStatusSummary,
  listMilestones,
  updateMilestone,
} from "@/modules/milestones/service";

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

export const milestoneResolvers = {
  Query: {
    milestone: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        return getMilestone(actor, args.id);
      }),
    milestones: async (
      _parent: unknown,
      args: {
        filter?: { search?: string; status?: string; projectId?: string };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        const filter = parse(milestoneListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listMilestones(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    milestoneStatusSummary: async (
      _parent: unknown,
      args: { projectId?: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        return getMilestoneStatusSummary(actor, args.projectId);
      }),
  },
  Mutation: {
    createMilestone: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_UPDATE");
        const input = parse(createMilestoneSchema, args.input);
        return createMilestone(actor, input);
      }),
    updateMilestone: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_UPDATE");
        const input = parse(updateMilestoneSchema, args.input);
        return updateMilestone(actor, args.id, input);
      }),
    deleteMilestone: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_UPDATE");
        return deleteMilestone(actor, args.id);
      }),
  },
};
