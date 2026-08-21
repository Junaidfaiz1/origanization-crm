export const clientTypeDefs = /* GraphQL */ `
  type ClientCompany {
    id: ID!
    name: String!
  }

  type ClientPrimaryContact {
    id: ID!
    name: String!
    email: String
  }

  enum ClientStatus {
    ACTIVE
    INACTIVE
    ON_HOLD
  }

  type Client {
    id: ID!
    companyId: ID!
    company: ClientCompany!
    primaryContactId: ID
    primaryContact: ClientPrimaryContact
    status: ClientStatus!
    notes: String
    opportunityCount: Int!
    projectCount: Int!
    proposalCount: Int!
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ClientEdge {
    cursor: String!
    node: Client!
  }

  type ClientConnection {
    edges: [ClientEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input ClientFilterInput {
    search: String
    status: ClientStatus
    companyId: ID
  }

  input CreateClientInput {
    companyId: ID!
    primaryContactId: ID
    status: ClientStatus
    notes: String
  }

  input UpdateClientInput {
    companyId: ID
    primaryContactId: ID
    status: ClientStatus
    notes: String
  }

  extend type Query {
    client(id: ID!): Client
    clients(filter: ClientFilterInput, after: String, first: Int): ClientConnection!
  }

  extend type Mutation {
    createClient(input: CreateClientInput!): Client!
    updateClient(id: ID!, input: UpdateClientInput!): Client!
    archiveClient(id: ID!): Client!
  }
`;
