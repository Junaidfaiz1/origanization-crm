import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import {
  bidListFilterSchema,
  bidRequestListFilterSchema,
  createBidRequestSchema,
  negotiateBidSchema,
  submitBidSchema,
  updateBidRequestSchema,
  updateBidSchema,
} from "@/modules/bidding/validation";
import {
  acceptBid,
  cancelBidRequest,
  closeBidRequest,
  createBidRequest,
  getBid,
  getBiddingSummary,
  getBidRequest,
  listBidRequests,
  listBids,
  listBidsForComparison,
  negotiateBid,
  openBidRequest,
  pauseBidRequest,
  rejectBid,
  shortlistBid,
  submitBid,
  updateBidRequest,
  updateMyBid,
  withdrawBid,
} from "@/modules/bidding/service";

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

export const biddingResolvers = {
  Query: {
    bidRequest: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_VIEW");
        return getBidRequest(actor, args.id);
      }),
    bidRequests: async (
      _p: unknown,
      args: {
        filter?: { search?: string; status?: string; projectId?: string };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_VIEW");
        const filter = parse(bidRequestListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listBidRequests(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    bid: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_VIEW");
        return getBid(actor, args.id);
      }),
    bids: async (
      _p: unknown,
      args: {
        filter?: { bidRequestId?: string; status?: string; mineOnly?: boolean };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_VIEW");
        const filter = parse(bidListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listBids(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    bidComparison: async (
      _p: unknown,
      args: { bidRequestId: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_VIEW");
        return listBidsForComparison(actor, args.bidRequestId);
      }),
    biddingSummary: async (_p: unknown, _a: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_VIEW");
        return getBiddingSummary(actor);
      }),
  },
  Mutation: {
    createBidRequest: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_CREATE");
        return createBidRequest(actor, parse(createBidRequestSchema, args.input));
      }),
    updateBidRequest: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_UPDATE");
        return updateBidRequest(actor, args.id, parse(updateBidRequestSchema, args.input));
      }),
    openBidRequest: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_OPEN");
        return openBidRequest(actor, args.id);
      }),
    pauseBidRequest: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_UPDATE");
        return pauseBidRequest(actor, args.id);
      }),
    closeBidRequest: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_CLOSE");
        return closeBidRequest(actor, args.id);
      }),
    cancelBidRequest: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REQUEST_UPDATE");
        return cancelBidRequest(actor, args.id);
      }),
    submitBid: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_SUBMIT");
        return submitBid(actor, parse(submitBidSchema, args.input));
      }),
    updateMyBid: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_UPDATE");
        return updateMyBid(actor, args.id, parse(updateBidSchema, args.input));
      }),
    withdrawBid: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_UPDATE");
        return withdrawBid(actor, args.id);
      }),
    shortlistBid: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_SHORTLIST");
        return shortlistBid(actor, args.id);
      }),
    rejectBid: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_REJECT");
        return rejectBid(actor, args.id);
      }),
    negotiateBid: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const canNegotiate =
          hasPermission(ctx.permissions, "BID_UPDATE") ||
          hasPermission(ctx.permissions, "BID_SHORTLIST") ||
          hasPermission(ctx.permissions, "BID_ACCEPT");
        if (!canNegotiate) {
          requirePermission(ctx, "BID_UPDATE");
        }
        const actor = requirePermission(
          ctx,
          hasPermission(ctx.permissions, "BID_UPDATE")
            ? "BID_UPDATE"
            : hasPermission(ctx.permissions, "BID_SHORTLIST")
              ? "BID_SHORTLIST"
              : "BID_ACCEPT",
        );
        return negotiateBid(actor, args.id, parse(negotiateBidSchema, args.input));
      }),
    acceptBid: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "BID_ACCEPT");
        return acceptBid(actor, args.id);
      }),
  },
};
