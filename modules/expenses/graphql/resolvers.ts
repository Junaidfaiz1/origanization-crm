import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createExpenseSchema,
  expenseListFilterSchema,
  updateExpenseSchema,
  updateExpenseStatusSchema,
} from "@/modules/expenses/validation";
import {
  createExpense,
  deleteExpense,
  getExpense,
  getExpenseSummary,
  listExpenses,
  updateExpense,
  updateExpenseStatus,
} from "@/modules/expenses/service";

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

export const expenseResolvers = {
  Query: {
    expense: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "EXPENSE_VIEW");
        return getExpense(actor, args.id);
      }),
    expenses: async (
      _p: unknown,
      args: {
        filter?: Record<string, unknown>;
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "EXPENSE_VIEW");
        const filter = parse(expenseListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listExpenses(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    expenseSummary: async (
      _p: unknown,
      args: { projectId?: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "EXPENSE_VIEW");
        return getExpenseSummary(actor, args.projectId);
      }),
  },
  Mutation: {
    createExpense: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "EXPENSE_CREATE");
        return createExpense(actor, parse(createExpenseSchema, args.input));
      }),
    updateExpense: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "EXPENSE_CREATE");
        return updateExpense(actor, args.id, parse(updateExpenseSchema, args.input));
      }),
    updateExpenseStatus: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "EXPENSE_UPDATE");
        return updateExpenseStatus(actor, args.id, parse(updateExpenseStatusSchema, args.input));
      }),
    deleteExpense: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "EXPENSE_CREATE");
        return deleteExpense(actor, args.id);
      }),
  },
};
