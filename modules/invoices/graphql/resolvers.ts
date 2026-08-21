import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createInvoiceSchema,
  invoiceListFilterSchema,
  updateInvoiceSchema,
} from "@/modules/invoices/validation";
import {
  cancelInvoice,
  createInvoice,
  deleteInvoice,
  getInvoice,
  getInvoiceSummary,
  listInvoices,
  markInvoiceOverdue,
  sendInvoice,
  updateInvoice,
} from "@/modules/invoices/service";

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

export const invoiceResolvers = {
  Query: {
    invoice: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_VIEW");
        return getInvoice(actor, args.id);
      }),
    invoices: async (
      _p: unknown,
      args: {
        filter?: Record<string, unknown>;
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_VIEW");
        const filter = parse(invoiceListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listInvoices(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    invoiceSummary: async (
      _p: unknown,
      args: { projectId?: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_VIEW");
        return getInvoiceSummary(actor, args.projectId);
      }),
  },
  Mutation: {
    createInvoice: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_CREATE");
        return createInvoice(actor, parse(createInvoiceSchema, args.input));
      }),
    updateInvoice: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_CREATE");
        return updateInvoice(actor, args.id, parse(updateInvoiceSchema, args.input));
      }),
    sendInvoice: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_SEND");
        return sendInvoice(actor, args.id);
      }),
    cancelInvoice: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_UPDATE");
        return cancelInvoice(actor, args.id);
      }),
    markInvoiceOverdue: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_UPDATE");
        return markInvoiceOverdue(actor, args.id);
      }),
    deleteInvoice: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "INVOICE_CREATE");
        return deleteInvoice(actor, args.id);
      }),
  },
};
