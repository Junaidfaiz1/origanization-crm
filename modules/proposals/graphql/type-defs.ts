export const proposalTypeDefs = /* GraphQL */ `
  enum ProposalStatus {
    DRAFT
    SENT
    VIEWED
    CHANGES_REQUESTED
    ACCEPTED
    REJECTED
    EXPIRED
  }

  type ProposalItem {
    id: ID!
    description: String!
    quantity: String!
    unitPrice: String!
    total: String!
  }

  type ProposalOpportunity {
    id: ID!
    name: String!
  }

  type ProposalClient {
    id: ID!
    companyName: String!
    companyId: ID!
  }

  type ProposalCreator {
    id: ID!
    name: String!
    email: String!
  }

  type Proposal {
    id: ID!
    opportunityId: ID!
    opportunity: ProposalOpportunity!
    clientId: ID!
    client: ProposalClient!
    title: String!
    description: String
    subtotal: String!
    discount: String!
    tax: String!
    total: String!
    currency: String!
    validUntil: DateTime
    status: ProposalStatus!
    createdById: ID!
    createdBy: ProposalCreator!
    sentAt: DateTime
    acceptedAt: DateTime
    rejectedAt: DateTime
    projectCount: Int!
    items: [ProposalItem!]!
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ProposalEdge {
    cursor: String!
    node: Proposal!
  }

  type ProposalConnection {
    edges: [ProposalEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input ProposalItemInput {
    description: String!
    quantity: Float!
    unitPrice: Float!
  }

  input ProposalFilterInput {
    search: String
    status: ProposalStatus
    clientId: ID
    opportunityId: ID
  }

  input CreateProposalInput {
    opportunityId: ID!
    title: String!
    description: String
    discount: Float
    tax: Float
    currency: String
    validUntil: String
    items: [ProposalItemInput!]!
  }

  input UpdateProposalInput {
    opportunityId: ID
    title: String
    description: String
    discount: Float
    tax: Float
    currency: String
    validUntil: String
    items: [ProposalItemInput!]
  }

  extend type Query {
    proposal(id: ID!): Proposal
    proposals(filter: ProposalFilterInput, after: String, first: Int): ProposalConnection!
  }

  extend type Mutation {
    createProposal(input: CreateProposalInput!): Proposal!
    updateProposal(id: ID!, input: UpdateProposalInput!): Proposal!
    sendProposal(id: ID!): Proposal!
    acceptProposal(id: ID!): Proposal!
    rejectProposal(id: ID!): Proposal!
    archiveProposal(id: ID!): Proposal!
  }
`;
