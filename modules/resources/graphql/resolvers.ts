import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createResourceSchema,
  resourceListFilterSchema,
  updateResourceSchema,
} from "@/modules/resources/validation";
import {
  createResource,
  deleteResource,
  getResource,
  getResourceSummary,
  listResources,
  updateResource,
} from "@/modules/resources/service";

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

export const resourceResolvers = {
  Query: {
    resource: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "RESOURCE_VIEW");
        return getResource(actor, args.id);
      }),
    resources: async (
      _p: unknown,
      args: {
        filter?: Record<string, unknown>;
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "RESOURCE_VIEW");
        const filter = parse(resourceListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listResources(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    resourceSummary: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "RESOURCE_VIEW");
        return getResourceSummary(actor);
      }),
  },
  Mutation: {
    createResource: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "RESOURCE_CREATE");
        return createResource(actor, parse(createResourceSchema, args.input));
      }),
    updateResource: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "RESOURCE_UPDATE");
        return updateResource(actor, args.id, parse(updateResourceSchema, args.input));
      }),
    deleteResource: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "RESOURCE_DELETE");
        return deleteResource(actor, args.id);
      }),
  },
};
