export const companyTypeDefs = /* GraphQL */ `
  type Company {
    id: ID!
    name: String!
    website: String
    industry: String
    address: String
    city: String
    country: String
    contactCount: Int!
    clientCount: Int!
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CompanyEdge {
    cursor: String!
    node: Company!
  }

  type CompanyConnection {
    edges: [CompanyEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input CompanyFilterInput {
    search: String
    industry: String
  }

  input CreateCompanyInput {
    name: String!
    website: String
    industry: String
    address: String
    city: String
    country: String
  }

  input UpdateCompanyInput {
    name: String
    website: String
    industry: String
    address: String
    city: String
    country: String
  }

  extend type Query {
    company(id: ID!): Company
    companies(filter: CompanyFilterInput, after: String, first: Int): CompanyConnection!
  }

  extend type Mutation {
    createCompany(input: CreateCompanyInput!): Company!
    updateCompany(id: ID!, input: UpdateCompanyInput!): Company!
    archiveCompany(id: ID!): Company!
  }
`;
