export const clientPortalTypeDefs = /* GraphQL */ `
  type PortalClient {
    id: ID!
    companyName: String!
    status: String!
  }

  type PortalHomeCounts {
    proposals: Int!
    projects: Int!
    invoices: Int!
    outstandingInvoices: Int!
  }

  type PortalHomeProposal {
    id: ID!
    title: String!
    status: String!
    total: String!
    currency: String!
    validUntil: DateTime
  }

  type PortalHomeInvoice {
    id: ID!
    invoiceNumber: String!
    status: String!
    total: String!
    amountDue: String!
    currency: String!
    issueDate: DateTime!
  }

  type PortalHome {
    client: PortalClient!
    counts: PortalHomeCounts!
    actionableProposals: [PortalHomeProposal!]!
    recentInvoices: [PortalHomeInvoice!]!
  }

  extend type Query {
    portalHome: PortalHome!
  }
`;
