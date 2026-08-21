export const projectTypeDefs = /* GraphQL */ `
  type ProjectClient {
    id: ID!
    companyName: String!
    companyId: ID!
  }

  type ProjectOpportunity {
    id: ID!
    name: String!
  }

  type ProjectProposal {
    id: ID!
    title: String!
  }

  type ProjectManager {
    id: ID!
    name: String!
    email: String!
  }

  enum ProjectStatus {
    PLANNING
    BIDDING
    RESOURCE_ASSIGNED
    IN_PROGRESS
    IN_REVIEW
    COMPLETED
    CANCELLED
    CLOSED
  }

  type Project {
    id: ID!
    clientId: ID!
    client: ProjectClient!
    opportunityId: ID
    opportunity: ProjectOpportunity
    proposalId: ID
    proposal: ProjectProposal
    name: String!
    description: String
    budget: String
    estimatedCost: String
    actualCost: String
    startDate: DateTime
    endDate: DateTime
    status: ProjectStatus!
    managerId: ID
    manager: ProjectManager
    bidRequestCount: Int!
    milestoneCount: Int!
    taskCount: Int!
    memberCount: Int!
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProjectEdge {
    cursor: String!
    node: Project!
  }

  type ProjectConnection {
    edges: [ProjectEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProjectStatusSummaryItem {
    status: ProjectStatus!
    count: Int!
  }

  type ProjectStatusSummary {
    total: Int!
    activeCount: Int!
    stages: [ProjectStatusSummaryItem!]!
  }

  input ProjectFilterInput {
    search: String
    status: ProjectStatus
    clientId: ID
    managerId: ID
  }

  input CreateProjectInput {
    clientId: ID!
    opportunityId: ID
    proposalId: ID
    name: String!
    description: String
    budget: String
    estimatedCost: String
    actualCost: String
    startDate: String
    endDate: String
    status: ProjectStatus
    managerId: ID
  }

  input UpdateProjectInput {
    clientId: ID
    opportunityId: ID
    proposalId: ID
    name: String
    description: String
    budget: String
    estimatedCost: String
    actualCost: String
    startDate: String
    endDate: String
    status: ProjectStatus
    managerId: ID
  }

  extend type Query {
    project(id: ID!): Project
    projects(filter: ProjectFilterInput, after: String, first: Int): ProjectConnection!
    projectStatusSummary: ProjectStatusSummary!
  }

  extend type Mutation {
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    archiveProject(id: ID!): Project!
  }
`;
