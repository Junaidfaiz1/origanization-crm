import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  clientListFilterSchema,
  createClientSchema,
  updateClientSchema,
} from "@/modules/clients/validation";
import {
  archiveClient,
  createClient,
  getClient,
  listClients,
  updateClient,
} from "@/modules/clients/service";

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

export const clientResolvers = {
  Query: {
    client: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CLIENT_VIEW");
        return getClient(actor, args.id);
      }),
    clients: async (
      _parent: unknown,
      args: {
        filter?: { search?: string; status?: string; companyId?: string };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CLIENT_VIEW");
        const filter = parse(clientListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listClients(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
  },
  Mutation: {
    createClient: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CLIENT_CREATE");
        const input = parse(createClientSchema, args.input);
        return createClient(actor, input);
      }),
    updateClient: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CLIENT_UPDATE");
        const input = parse(updateClientSchema, args.input);
        return updateClient(actor, args.id, input);
      }),
    archiveClient: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CLIENT_DELETE");
        return archiveClient(actor, args.id);
      }),
  },
};
