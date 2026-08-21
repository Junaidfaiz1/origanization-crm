import { encodeCursor } from "@/lib/graphql/pagination";
import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requirePermission } from "@/lib/permissions/guards";
import { ValidationError } from "@/lib/errors/app-error";
import {
  companyListFilterSchema,
  createCompanySchema,
  updateCompanySchema,
} from "@/modules/companies/validation";
import {
  archiveCompany,
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "@/modules/companies/service";

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

export const companyResolvers = {
  Query: {
    company: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "COMPANY_VIEW");
        return getCompany(actor, args.id);
      }),
    companies: async (
      _parent: unknown,
      args: {
        filter?: { search?: string; industry?: string };
        after?: string;
        first?: number;
      },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "COMPANY_VIEW");
        const filter = parse(companyListFilterSchema, {
          ...args.filter,
          cursor: args.after,
          first: args.first,
        });
        const result = await listCompanies(actor, filter);
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
    createCompany: async (
      _parent: unknown,
      args: { input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "COMPANY_CREATE");
        const input = parse(createCompanySchema, args.input);
        return createCompany(actor, input);
      }),
    updateCompany: async (
      _parent: unknown,
      args: { id: string; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "COMPANY_UPDATE");
        const input = parse(updateCompanySchema, args.input);
        return updateCompany(actor, args.id, input);
      }),
    archiveCompany: async (
      _parent: unknown,
      args: { id: string },
      ctx: GraphQLContext,
    ) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "COMPANY_UPDATE");
        return archiveCompany(actor, args.id);
      }),
  },
};
