export const authTypeDefs = /* GraphQL */ `
  type HealthStatus {
    ok: Boolean!
    service: String!
  }

  type OrganizationSummary {
    id: ID!
    name: String!
    slug: String!
    currency: String!
  }

  type User {
    id: ID!
    name: String!
    email: String!
    avatar: String
    roleKey: String!
    roleName: String!
    permissions: [String!]!
    organization: OrganizationSummary!
  }

  extend type Query {
    health: HealthStatus!
    me: User
  }
`;
