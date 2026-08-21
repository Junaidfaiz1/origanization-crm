import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import { progressListFilterSchema } from "@/modules/progress/validation";
import {
  getProgressOverview,
  getProjectProgress,
  listProjectProgress,
} from "@/modules/progress/service";

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

export const progressResolvers = {
  Query: {
    projectProgress: async (
      _parent: unknown,
      args: { projectId: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        return getProjectProgress(actor, args.projectId);
      }),
    projectProgressList: async (
      _parent: unknown,
      args: {
        filter?: { search?: string; health?: string; status?: string };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        const filter = parse(progressListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        return listProjectProgress(actor, filter);
      }),
    projectProgressOverview: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        return getProgressOverview(actor);
      }),
  },
  ProgressCounts: {
    completed: (parent: { completed?: number; done?: number }) =>
      parent.completed ?? parent.done ?? 0,
    done: (parent: { completed?: number; done?: number }) =>
      parent.done ?? parent.completed ?? 0,
  },
};
