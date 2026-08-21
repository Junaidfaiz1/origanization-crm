export const contactTypeDefs = /* GraphQL */ `
  type ContactCompany {
    id: ID!
    name: String!
  }

  type Contact {
    id: ID!
    companyId: ID!
    company: ContactCompany!
    name: String!
    email: String
    phone: String
    designation: String
    primaryClientCount: Int!
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ContactEdge {
    cursor: String!
    node: Contact!
  }

  type ContactConnection {
    edges: [ContactEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input ContactFilterInput {
    search: String
    companyId: ID
  }

  input CreateContactInput {
    companyId: ID!
    name: String!
    email: String
    phone: String
    designation: String
  }

  input UpdateContactInput {
    companyId: ID
    name: String
    email: String
    phone: String
    designation: String
  }

  extend type Query {
    contact(id: ID!): Contact
    contacts(filter: ContactFilterInput, after: String, first: Int): ContactConnection!
  }

  extend type Mutation {
    createContact(input: CreateContactInput!): Contact!
    updateContact(id: ID!, input: UpdateContactInput!): Contact!
    archiveContact(id: ID!): Contact!
  }
`;
