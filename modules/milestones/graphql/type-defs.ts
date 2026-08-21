export const milestoneTypeDefs = /* GraphQL */ `
  enum MilestoneStatus {
    PENDING
    IN_PROGRESS
    IN_REVIEW
    COMPLETED
    BLOCKED
  }

  type MilestoneProject {
    id: ID!
    name: String!
    status: String!
    clientId: ID!
    clientName: String!
  }

  type Milestone {
    id: ID!
    projectId: ID!
    project: MilestoneProject!
    name: String!
    description: String
    amount: String
    dueDate: DateTime
    status: MilestoneStatus!
    order: Int!
    taskCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MilestoneEdge {
    cursor: String!
    node: Milestone!
  }

  type MilestoneConnection {
    edges: [MilestoneEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type MilestoneStatusSummaryItem {
    status: MilestoneStatus!
    count: Int!
  }

  type MilestoneStatusSummary {
    total: Int!
    totalAmount: String!
    completedAmount: String!
    stages: [MilestoneStatusSummaryItem!]!
  }

  input MilestoneFilterInput {
    search: String
    status: MilestoneStatus
    projectId: ID
  }

  input CreateMilestoneInput {
    projectId: ID!
    name: String!
    description: String
    amount: String
    dueDate: String
    status: MilestoneStatus
    order: Int
  }

  input UpdateMilestoneInput {
    name: String
    description: String
    amount: String
    dueDate: String
    status: MilestoneStatus
    order: Int
  }

  extend type Query {
    milestone(id: ID!): Milestone
    milestones(filter: MilestoneFilterInput, after: String, first: Int): MilestoneConnection!
    milestoneStatusSummary(projectId: ID): MilestoneStatusSummary!
  }

  extend type Mutation {
    createMilestone(input: CreateMilestoneInput!): Milestone!
    updateMilestone(id: ID!, input: UpdateMilestoneInput!): Milestone!
    deleteMilestone(id: ID!): Milestone!
  }
`;
