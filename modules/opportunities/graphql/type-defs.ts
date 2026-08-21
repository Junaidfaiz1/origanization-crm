export const opportunityTypeDefs = /* GraphQL */ `
  enum OpportunityStage {
    NEW
    DISCOVERY
    REQUIREMENTS
    PROPOSAL
    NEGOTIATION
    WON
    LOST
  }

  type OpportunityClient {
    id: ID!
    companyName: String!
    companyId: ID!
  }

  type OpportunityAssignee {
    id: ID!
    name: String!
    email: String!
  }

  type OpportunityStageSummary {
    stage: OpportunityStage!
    count: Int!
    value: String!
  }

  type OpportunityPipelineSummary {
    openCount: Int!
    totalCount: Int!
    pipelineValue: String!
    weightedValue: String!
    winRate: String
    stages: [OpportunityStageSummary!]!
  }

  type Opportunity {
    id: ID!
    clientId: ID!
    client: OpportunityClient!
    name: String!
    description: String
    estimatedValue: String
    probability: Int!
    weightedValue: String!
    expectedCloseDate: DateTime
    stage: OpportunityStage!
    assignedToId: ID
    assignedTo: OpportunityAssignee
    proposalCount: Int!
    projectCount: Int!
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type OpportunityEdge {
    cursor: String!
    node: Opportunity!
  }

  type OpportunityConnection {
    edges: [OpportunityEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input OpportunityFilterInput {
    search: String
    stage: OpportunityStage
    clientId: ID
    assignedToId: ID
  }

  input CreateOpportunityInput {
    clientId: ID!
    name: String!
    description: String
    estimatedValue: Float
    probability: Int
    expectedCloseDate: String
    stage: OpportunityStage
    assignedToId: ID
  }

  input UpdateOpportunityInput {
    clientId: ID
    name: String
    description: String
    estimatedValue: Float
    probability: Int
    expectedCloseDate: String
    stage: OpportunityStage
    assignedToId: ID
  }

  extend type Query {
    opportunity(id: ID!): Opportunity
    opportunities(
      filter: OpportunityFilterInput
      after: String
      first: Int
    ): OpportunityConnection!
    opportunityPipelineSummary: OpportunityPipelineSummary!
  }

  extend type Mutation {
    createOpportunity(input: CreateOpportunityInput!): Opportunity!
    updateOpportunity(id: ID!, input: UpdateOpportunityInput!): Opportunity!
    archiveOpportunity(id: ID!): Opportunity!
  }
`;
