import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { AuthenticationError, AuthorizationError } from "@/lib/errors/app-error";
import { getFreelancerHome } from "@/modules/freelancer-portal/service";

async function run<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw formatGraphQLError(error, requestId);
  }
}

export const freelancerPortalResolvers = {
  Query: {
    freelancerPortalHome: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        if (!ctx.userId || !ctx.organizationId) {
          throw new AuthenticationError();
        }
        if (ctx.roleKey !== "FREELANCER") {
          throw new AuthorizationError("Freelancer portal only");
        }
        const home = await getFreelancerHome({
          userId: ctx.userId,
          organizationId: ctx.organizationId,
          roleKey: ctx.roleKey,
          permissions: ctx.permissions,
        });
        return {
          profile: home.profile,
          counts: home.counts,
          openRequests: home.openRequests,
          myBids: home.myBids,
          myTasks: home.myTasks,
        };
      }),
  },
};
