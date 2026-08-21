export const activityTypeDefs = /* GraphQL */ `
  type ActivityActor {
    id: ID!
    name: String!
    email: String!
  }

  type ActivityItem {
    id: ID!
    action: String!
    entityType: String!
    entityId: ID!
    href: String
    summary: String
    user: ActivityActor
    createdAt: DateTime!
  }

  type ActivityEdge {
    cursor: String!
    node: ActivityItem!
  }

  type ActivityConnection {
    edges: [ActivityEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input ActivityFilterInput {
    search: String
    projectId: ID
    entityType: String
  }

  extend type Query {
    activity(filter: ActivityFilterInput, after: String, first: Int): ActivityConnection!
    projectActivity(projectId: ID!, first: Int): [ActivityItem!]!
  }
`;
