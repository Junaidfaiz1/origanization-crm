import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { createLeadSchema, leadListFilterSchema, updateLeadSchema } from "@/modules/leads/validation";
import {
  archiveLead,
  convertLead,
  createLead,
  getLead,
  listLeads,
  updateLead,
} from "@/modules/leads/service";
import { ValidationError } from "@/lib/errors/app-error";

async function run<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw formatGraphQLError(error, requestId);
  }
}

function parse<T>(
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } } },
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

export const leadResolvers = {
  Query: {
    lead: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "LEAD_VIEW");
        return getLead(actor, args.id);
      }),
    leads: async (
      _parent: unknown,
      args: {
        filter?: { search?: string; status?: string; assignedToId?: string };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "LEAD_VIEW");
        const filter = parse(leadListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listLeads(actor, filter);
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
    createLead: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "LEAD_CREATE");
        const input = parse(createLeadSchema, args.input);
        return createLead(actor, input);
      }),
    updateLead: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "LEAD_UPDATE");
        const input = parse(updateLeadSchema, args.input);
        return updateLead(actor, args.id, input);
      }),
    archiveLead: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "LEAD_DELETE");
        return archiveLead(actor, args.id);
      }),
    convertLead: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "LEAD_UPDATE");
        return convertLead(actor, args.id);
      }),
  },
};
