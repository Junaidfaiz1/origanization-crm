import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createTimeEntrySchema,
  startTimerSchema,
  timeEntryListFilterSchema,
  updateTimeEntrySchema,
} from "@/modules/time-tracking/validation";
import {
  createTimeEntry,
  deleteTimeEntry,
  getActiveTimeEntry,
  getTimeEntry,
  getTimeEntrySummary,
  listTimeEntries,
  startTimer,
  stopTimeEntry,
  updateTimeEntry,
} from "@/modules/time-tracking/service";

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

export const timeTrackingResolvers = {
  Query: {
    timeEntry: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_VIEW");
        return getTimeEntry(actor, args.id);
      }),
    timeEntries: async (
      _p: unknown,
      args: {
        filter?: Record<string, unknown>;
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_VIEW");
        const filter = parse(timeEntryListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listTimeEntries(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    activeTimeEntry: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_VIEW");
        return getActiveTimeEntry(actor);
      }),
    timeEntrySummary: async (
      _p: unknown,
      args: { projectId?: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_VIEW");
        return getTimeEntrySummary(actor, args.projectId);
      }),
  },
  Mutation: {
    createTimeEntry: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_CREATE");
        return createTimeEntry(actor, parse(createTimeEntrySchema, args.input));
      }),
    updateTimeEntry: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_UPDATE");
        return updateTimeEntry(actor, args.id, parse(updateTimeEntrySchema, args.input));
      }),
    deleteTimeEntry: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_UPDATE");
        return deleteTimeEntry(actor, args.id);
      }),
    startTimer: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_CREATE");
        return startTimer(actor, parse(startTimerSchema, args.input));
      }),
    stopTimeEntry: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TIME_ENTRY_UPDATE");
        return stopTimeEntry(actor, args.id);
      }),
  },
};
