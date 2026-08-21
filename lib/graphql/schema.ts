import { createSchema } from "graphql-yoga";
import { DateTimeResolver } from "graphql-scalars";
import { authTypeDefs } from "@/modules/auth/graphql/type-defs";
import { authResolvers } from "@/modules/auth/graphql/resolvers";
import { leadTypeDefs } from "@/modules/leads/graphql/type-defs";
import { leadResolvers } from "@/modules/leads/graphql/resolvers";
import { companyTypeDefs } from "@/modules/companies/graphql/type-defs";
import { companyResolvers } from "@/modules/companies/graphql/resolvers";
import { contactTypeDefs } from "@/modules/contacts/graphql/type-defs";
import { contactResolvers } from "@/modules/contacts/graphql/resolvers";
import { clientTypeDefs } from "@/modules/clients/graphql/type-defs";
import { clientResolvers } from "@/modules/clients/graphql/resolvers";
import { opportunityTypeDefs } from "@/modules/opportunities/graphql/type-defs";
import { opportunityResolvers } from "@/modules/opportunities/graphql/resolvers";
import { proposalTypeDefs } from "@/modules/proposals/graphql/type-defs";
import { proposalResolvers } from "@/modules/proposals/graphql/resolvers";
import { projectTypeDefs } from "@/modules/projects/graphql/type-defs";
import { projectResolvers } from "@/modules/projects/graphql/resolvers";
import { milestoneTypeDefs } from "@/modules/milestones/graphql/type-defs";
import { milestoneResolvers } from "@/modules/milestones/graphql/resolvers";
import { requirementTypeDefs } from "@/modules/requirements/graphql/type-defs";
import { requirementResolvers } from "@/modules/requirements/graphql/resolvers";
import { teamTypeDefs } from "@/modules/team/graphql/type-defs";
import { teamResolvers } from "@/modules/team/graphql/resolvers";
import { fileTypeDefs } from "@/modules/files/graphql/type-defs";
import { fileResolvers } from "@/modules/files/graphql/resolvers";
import { biddingTypeDefs } from "@/modules/bidding/graphql/type-defs";
import { biddingResolvers } from "@/modules/bidding/graphql/resolvers";
import { taskTypeDefs } from "@/modules/tasks/graphql/type-defs";
import { taskResolvers } from "@/modules/tasks/graphql/resolvers";
import { resourceTypeDefs } from "@/modules/resources/graphql/type-defs";
import { resourceResolvers } from "@/modules/resources/graphql/resolvers";
import { timeTrackingTypeDefs } from "@/modules/time-tracking/graphql/type-defs";
import { timeTrackingResolvers } from "@/modules/time-tracking/graphql/resolvers";
import { expenseTypeDefs } from "@/modules/expenses/graphql/type-defs";
import { expenseResolvers } from "@/modules/expenses/graphql/resolvers";
import { contractTypeDefs } from "@/modules/contracts/graphql/type-defs";
import { contractResolvers } from "@/modules/contracts/graphql/resolvers";
import { invoiceTypeDefs } from "@/modules/invoices/graphql/type-defs";
import { invoiceResolvers } from "@/modules/invoices/graphql/resolvers";
import { paymentTypeDefs } from "@/modules/payments/graphql/type-defs";
import { paymentResolvers } from "@/modules/payments/graphql/resolvers";
import { clientPortalTypeDefs } from "@/modules/client-portal/graphql/type-defs";
import { clientPortalResolvers } from "@/modules/client-portal/graphql/resolvers";
import { freelancerPortalTypeDefs } from "@/modules/freelancer-portal/graphql/type-defs";
import { freelancerPortalResolvers } from "@/modules/freelancer-portal/graphql/resolvers";
import { notificationTypeDefs } from "@/modules/notifications/graphql/type-defs";
import { notificationResolvers } from "@/modules/notifications/graphql/resolvers";
import { reportTypeDefs } from "@/modules/reports/graphql/type-defs";
import { reportResolvers } from "@/modules/reports/graphql/resolvers";
import { activityTypeDefs } from "@/modules/activity/graphql/type-defs";
import { activityResolvers } from "@/modules/activity/graphql/resolvers";
import { usersTypeDefs } from "@/modules/users/graphql/type-defs";
import { usersResolvers } from "@/modules/users/graphql/resolvers";
import { progressTypeDefs } from "@/modules/progress/graphql/type-defs";
import { progressResolvers } from "@/modules/progress/graphql/resolvers";

const rootTypeDefs = /* GraphQL */ `
  scalar DateTime

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

export const schema = createSchema({
  typeDefs: [
    rootTypeDefs,
    authTypeDefs,
    leadTypeDefs,
    companyTypeDefs,
    contactTypeDefs,
    clientTypeDefs,
    opportunityTypeDefs,
    proposalTypeDefs,
    projectTypeDefs,
    milestoneTypeDefs,
    requirementTypeDefs,
    teamTypeDefs,
    fileTypeDefs,
    biddingTypeDefs,
    taskTypeDefs,
    resourceTypeDefs,
    timeTrackingTypeDefs,
    expenseTypeDefs,
    contractTypeDefs,
    invoiceTypeDefs,
    paymentTypeDefs,
    clientPortalTypeDefs,
    freelancerPortalTypeDefs,
    notificationTypeDefs,
    reportTypeDefs,
    activityTypeDefs,
    usersTypeDefs,
    progressTypeDefs,
  ],
  resolvers: [
    { DateTime: DateTimeResolver },
    authResolvers,
    leadResolvers,
    companyResolvers,
    contactResolvers,
    clientResolvers,
    opportunityResolvers,
    proposalResolvers,
    projectResolvers,
    milestoneResolvers,
    requirementResolvers,
    teamResolvers,
    fileResolvers,
    biddingResolvers,
    taskResolvers,
    resourceResolvers,
    timeTrackingResolvers,
    expenseResolvers,
    contractResolvers,
    invoiceResolvers,
    paymentResolvers,
    clientPortalResolvers,
    freelancerPortalResolvers,
    notificationResolvers,
    reportResolvers,
    activityResolvers,
    usersResolvers,
    progressResolvers,
  ],
});

export { formatGraphQLError } from "@/lib/graphql/errors";
