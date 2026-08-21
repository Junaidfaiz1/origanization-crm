import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requireAuth } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import { notificationListFilterSchema } from "@/modules/notifications/validation";
import {
  getNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/service";

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

export const notificationResolvers = {
  Query: {
    notification: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requireAuth(ctx);
        return getNotification(actor, args.id);
      }),
    notifications: async (
      _p: unknown,
      args: {
        filter?: Record<string, unknown>;
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requireAuth(ctx);
        const filter = parse(notificationListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listNotifications(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    unreadNotificationCount: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requireAuth(ctx);
        return getUnreadNotificationCount(actor);
      }),
  },
  Mutation: {
    markNotificationRead: async (
      _p: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requireAuth(ctx);
        return markNotificationRead(actor, args.id);
      }),
    markAllNotificationsRead: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requireAuth(ctx);
        const result = await markAllNotificationsRead(actor);
        return result.count;
      }),
  },
};
