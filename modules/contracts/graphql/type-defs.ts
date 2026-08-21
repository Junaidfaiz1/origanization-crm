export const contractTypeDefs = /* GraphQL */ `
  enum ContractStatus {
    DRAFT
    SENT
    SIGNED
    ACTIVE
    COMPLETED
    CANCELLED
  }

  type ContractProject {
    id: ID!
    name: String!
    status: String!
    clientName: String!
  }

  type ContractClient {
    id: ID!
    name: String!
  }

  type ContractResource {
    id: ID!
    name: String!
    email: String!
  }

  type ContractBid {
    id: ID!
    amount: String!
    status: String!
  }

  type Contract {
    id: ID!
    projectId: ID!
    project: ContractProject!
    clientId: ID!
    client: ContractClient!
    resourceId: ID
    resource: ContractResource
    bidId: ID
    bid: ContractBid
    title: String!
    content: String
    totalAmount: String!
    currency: String!
    startDate: DateTime
    endDate: DateTime
    status: ContractStatus!
    signedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ContractEdge {
    cursor: String!
    node: Contract!
  }

  type ContractConnection {
    edges: [ContractEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ContractStatusSummaryItem {
    status: ContractStatus!
    count: Int!
  }

  type ContractSummary {
    total: Int!
    draftCount: Int!
    activeCount: Int!
    signedCount: Int!
    completedCount: Int!
    draftAmount: String!
    activeAmount: String!
    stages: [ContractStatusSummaryItem!]!
  }

  input ContractFilterInput {
    search: String
    status: ContractStatus
    projectId: ID
    clientId: ID
  }

  input CreateContractInput {
    projectId: ID!
    resourceId: ID
    bidId: ID
    title: String!
    content: String
    totalAmount: String!
    currency: String
    startDate: String
    endDate: String
  }

  input UpdateContractInput {
    projectId: ID
    resourceId: ID
    bidId: ID
    title: String
    content: String
    totalAmount: String
    currency: String
    startDate: String
    endDate: String
  }

  input UpdateContractStatusInput {
    status: ContractStatus!
  }

  extend type Query {
    contract(id: ID!): Contract
    contracts(filter: ContractFilterInput, after: String, first: Int): ContractConnection!
    contractSummary(projectId: ID): ContractSummary!
  }

  extend type Mutation {
    createContract(input: CreateContractInput!): Contract!
    updateContract(id: ID!, input: UpdateContractInput!): Contract!
    updateContractStatus(id: ID!, input: UpdateContractStatusInput!): Contract!
    deleteContract(id: ID!): Contract!
  }
`;
