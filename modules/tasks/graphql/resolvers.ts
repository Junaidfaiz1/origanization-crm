import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createTaskSchema,
  taskListFilterSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "@/modules/tasks/validation";
import {
  createTask,
  deleteTask,
  getTask,
  getTaskStatusSummary,
  listTasks,
  listTasksForKanban,
  updateTask,
  updateTaskStatus,
} from "@/modules/tasks/service";

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

export const taskResolvers = {
  Query: {
    task: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_VIEW");
        return getTask(actor, args.id);
      }),
    tasks: async (
      _p: unknown,
      args: {
        filter?: Record<string, unknown>;
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_VIEW");
        const filter = parse(taskListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listTasks(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    taskKanban: async (
      _p: unknown,
      args: { filter?: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_VIEW");
        const filter = parse(taskListFilterSchema, args.filter ?? {});
        return listTasksForKanban(actor, filter);
      }),
    taskStatusSummary: async (
      _p: unknown,
      args: { projectId?: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_VIEW");
        return getTaskStatusSummary(actor, args.projectId);
      }),
  },
  Mutation: {
    createTask: async (
      _p: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_CREATE");
        return createTask(actor, parse(createTaskSchema, args.input));
      }),
    updateTask: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_UPDATE");
        return updateTask(actor, args.id, parse(updateTaskSchema, args.input));
      }),
    updateTaskStatus: async (
      _p: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_UPDATE");
        return updateTaskStatus(actor, args.id, parse(updateTaskStatusSchema, args.input));
      }),
    deleteTask: async (_p: unknown, args: { id: string }, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "TASK_DELETE");
        return deleteTask(actor, args.id);
      }),
  },
};
