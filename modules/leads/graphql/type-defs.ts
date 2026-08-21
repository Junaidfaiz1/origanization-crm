export const leadTypeDefs = /* GraphQL */ `
  enum LeadStatus {
    NEW
    CONTACTED
    QUALIFIED
    UNQUALIFIED
    CONVERTED
    LOST
  }

  type LeadAssignee {
    id: ID!
    name: String!
    email: String!
  }

  type Lead {
    id: ID!
    name: String!
    email: String
    phone: String
    companyName: String
    source: String
    estimatedValue: String
    status: LeadStatus!
    assignedToId: ID
    assignedTo: LeadAssignee
    notes: String
    convertedClientId: ID
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type LeadEdge {
    cursor: String!
    node: Lead!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type LeadConnection {
    edges: [LeadEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input LeadFilterInput {
    search: String
    status: LeadStatus
    assignedToId: ID
  }

  input CreateLeadInput {
    name: String!
    email: String
    phone: String
    companyName: String
    source: String
    estimatedValue: Float
    status: LeadStatus
    assignedToId: ID
    notes: String
  }

  input UpdateLeadInput {
    name: String
    email: String
    phone: String
    companyName: String
    source: String
    estimatedValue: Float
    status: LeadStatus
    assignedToId: ID
    notes: String
  }

  type ConvertLeadResult {
    lead: Lead!
    clientId: ID!
    opportunityId: ID!
  }

  extend type Query {
    lead(id: ID!): Lead
    leads(filter: LeadFilterInput, after: String, first: Int): LeadConnection!
  }

  extend type Mutation {
    createLead(input: CreateLeadInput!): Lead!
    updateLead(id: ID!, input: UpdateLeadInput!): Lead!
    archiveLead(id: ID!): Lead!
    convertLead(id: ID!): ConvertLeadResult!
  }
`;
