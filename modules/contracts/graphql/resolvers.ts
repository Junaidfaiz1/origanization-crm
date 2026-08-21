import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  contractListFilterSchema,
  createContractSchema,
  updateContractSchema,
  updateContractStatusSchema,
} from "@/modules/contracts/validation";
import {
  createContract,
  deleteContract,
  getContract,
  getContractSummary,
  listContracts,
  updateContract,
  updateContractStatus,
} from "@/modules/contracts/service";

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

export const contractResolvers = {
  Query: {
    contract: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CONTRACT_VIEW");
        return getContract(actor, args.id);
      }),
    contracts: async (
      _p: unknown,
      args: {
        filter?: Record<string, unknown>;
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CONTRACT_VIEW");
        const filter = parse(contractListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listContracts(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    contractSummary: async (
      _p: unknown,
      args: { projectId?: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CONTRACT_VIEW");
        return getContractSummary(actor, args.projectId);
      }),
  },
  Mutation: {
    createContract: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CONTRACT_CREATE");
        return createContract(actor, parse(createContractSchema, args.input));
      }),
    updateContract: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CONTRACT_CREATE");
        return updateContract(actor, args.id, parse(updateContractSchema, args.input));
      }),
    updateContractStatus: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CONTRACT_UPDATE");
        return updateContractStatus(
          actor,
          args.id,
          parse(updateContractStatusSchema, args.input),
        );
      }),
    deleteContract: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "CONTRACT_CREATE");
        return deleteContract(actor, args.id);
      }),
  },
};
