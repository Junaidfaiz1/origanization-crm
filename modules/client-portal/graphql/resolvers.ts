import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { AuthenticationError, AuthorizationError } from "@/lib/errors/app-error";
import { getPortalHome } from "@/modules/client-portal/service";

async function run<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw formatGraphQLError(error, requestId);
  }
}

export const clientPortalResolvers = {
  Query: {
    portalHome: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        if (!ctx.userId || !ctx.organizationId) {
          throw new AuthenticationError();
        }
        if (ctx.roleKey !== "CLIENT") {
          throw new AuthorizationError("Client portal only");
        }
        return getPortalHome({
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          roleKey: ctx.roleKey,
          permissions: ctx.permissions,
        });
      }),
  },
};
