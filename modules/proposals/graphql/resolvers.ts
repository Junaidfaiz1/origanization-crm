import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createProposalSchema,
  proposalListFilterSchema,
  updateProposalSchema,
} from "@/modules/proposals/validation";
import {
  acceptProposal,
  archiveProposal,
  createProposal,
  getProposal,
  listProposals,
  rejectProposal,
  sendProposal,
  updateProposal,
} from "@/modules/proposals/service";

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

export const proposalResolvers = {
  Query: {
    proposal: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_VIEW");
        return getProposal(actor, args.id);
      }),
    proposals: async (
      _parent: unknown,
      args: {
        filter?: {
          search?: string;
          status?: string;
          clientId?: string;
          opportunityId?: string;
        };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_VIEW");
        const filter = parse(proposalListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listProposals(actor, filter);
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
    createProposal: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_CREATE");
        const input = parse(createProposalSchema, args.input);
        return createProposal(actor, input);
      }),
    updateProposal: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_UPDATE");
        const input = parse(updateProposalSchema, args.input);
        return updateProposal(actor, args.id, input);
      }),
    sendProposal: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_SEND");
        return sendProposal(actor, args.id);
      }),
    acceptProposal: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_ACCEPT");
        return acceptProposal(actor, args.id);
      }),
    rejectProposal: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_REJECT");
        return rejectProposal(actor, args.id);
      }),
    archiveProposal: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROPOSAL_UPDATE");
        return archiveProposal(actor, args.id);
      }),
  },
};
