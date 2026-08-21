export const requirementTypeDefs = /* GraphQL */ `
  enum RequirementStatus {
    OPEN
    IN_PROGRESS
    DONE
    CANCELLED
  }

  enum RequirementPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  type RequirementProject {
    id: ID!
    name: String!
    status: String!
    clientId: ID!
    clientName: String!
  }

  type ProjectRequirement {
    id: ID!
    projectId: ID!
    project: RequirementProject!
    title: String!
    description: String
    priority: RequirementPriority!
    status: RequirementStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RequirementEdge {
    cursor: String!
    node: ProjectRequirement!
  }

  type RequirementConnection {
    edges: [RequirementEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type RequirementStatusSummaryItem {
    status: RequirementStatus!
    count: Int!
  }

  type RequirementPrioritySummaryItem {
    priority: RequirementPriority!
    count: Int!
  }

  type RequirementStatusSummary {
    total: Int!
    openCount: Int!
    doneCount: Int!
    stages: [RequirementStatusSummaryItem!]!
    priorities: [RequirementPrioritySummaryItem!]!
  }

  input RequirementFilterInput {
    search: String
    status: RequirementStatus
    priority: RequirementPriority
    projectId: ID
  }

  input CreateRequirementInput {
    projectId: ID!
    title: String!
    description: String
    priority: RequirementPriority
    status: RequirementStatus
  }

  input UpdateRequirementInput {
    title: String
    description: String
    priority: RequirementPriority
    status: RequirementStatus
  }

  extend type Query {
    requirement(id: ID!): ProjectRequirement
    requirements(
      filter: RequirementFilterInput
      after: String
      first: Int
    ): RequirementConnection!
    requirementStatusSummary(projectId: ID): RequirementStatusSummary!
  }

  extend type Mutation {
    createRequirement(input: CreateRequirementInput!): ProjectRequirement!
    updateRequirement(id: ID!, input: UpdateRequirementInput!): ProjectRequirement!
    deleteRequirement(id: ID!): ProjectRequirement!
  }
`;
