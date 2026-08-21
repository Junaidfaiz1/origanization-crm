import { getAuthenticatedUser } from "@/modules/auth/service";
import type { GraphQLContext } from "@/lib/graphql/context";

export const authResolvers = {
  Query: {
    health: () => ({ ok: true, service: "technova-crm" }),
    me: async (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId || !ctx.organizationId) {
        return null;
      }
      return getAuthenticatedUser(ctx.userId, ctx.organizationId);
    },
  },
};
