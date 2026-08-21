import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createOpportunitySchema,
  opportunityListFilterSchema,
  updateOpportunitySchema,
} from "@/modules/opportunities/validation";
import {
  archiveOpportunity,
  createOpportunity,
  getOpportunity,
  getOpportunityPipelineSummary,
  listOpportunities,
  updateOpportunity,
} from "@/modules/opportunities/service";

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

export const opportunityResolvers = {
  Query: {
    opportunity: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "OPPORTUNITY_VIEW");
        return getOpportunity(actor, args.id);
      }),
    opportunities: async (
      _parent: unknown,
      args: {
        filter?: {
          search?: string;
          stage?: string;
          clientId?: string;
          assignedToId?: string;
        };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "OPPORTUNITY_VIEW");
        const filter = parse(opportunityListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listOpportunities(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    opportunityPipelineSummary: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "OPPORTUNITY_VIEW");
        return getOpportunityPipelineSummary(actor);
      }),
  },
  Mutation: {
    createOpportunity: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "OPPORTUNITY_CREATE");
        const input = parse(createOpportunitySchema, args.input);
        return createOpportunity(actor, input);
      }),
    updateOpportunity: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "OPPORTUNITY_UPDATE");
        const input = parse(updateOpportunitySchema, args.input);
        return updateOpportunity(actor, args.id, input);
      }),
    archiveOpportunity: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "OPPORTUNITY_UPDATE");
        return archiveOpportunity(actor, args.id);
      }),
  },
};
