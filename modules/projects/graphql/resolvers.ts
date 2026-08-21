import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  createProjectSchema,
  projectListFilterSchema,
  updateProjectSchema,
} from "@/modules/projects/validation";
import {
  archiveProject,
  createProject,
  getProject,
  getProjectStatusSummary,
  listProjects,
  updateProject,
} from "@/modules/projects/service";

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

export const projectResolvers = {
  Query: {
    project: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        return getProject(actor, args.id);
      }),
    projects: async (
      _parent: unknown,
      args: {
        filter?: {
          search?: string;
          status?: string;
          clientId?: string;
          managerId?: string;
        };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        const filter = parse(projectListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listProjects(actor, filter);
        return {
          edges: result.nodes.map((node) => ({
            cursor: encodeCursor(node.createdAt, node.id),
            node,
          })),
          pageInfo: result.pageInfo,
          totalCount: result.totalCount,
        };
      }),
    projectStatusSummary: async (
      _parent: unknown,
      _args: unknown,
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_VIEW");
        return getProjectStatusSummary(actor);
      }),
  },
  Mutation: {
    createProject: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_CREATE");
        const input = parse(createProjectSchema, args.input);
        return createProject(actor, input);
      }),
    updateProject: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_UPDATE");
        const input = parse(updateProjectSchema, args.input);
        return updateProject(actor, args.id, input);
      }),
    archiveProject: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "PROJECT_DELETE");
        return archiveProject(actor, args.id);
      }),
  },
};
