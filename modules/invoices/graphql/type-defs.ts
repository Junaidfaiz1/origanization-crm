export const invoiceTypeDefs = /* GraphQL */ `
  enum InvoiceStatus {
    DRAFT
    SENT
    PARTIALLY_PAID
    PAID
    OVERDUE
    CANCELLED
  }

  type InvoiceClient {
    id: ID!
    companyName: String!
    companyId: ID!
  }

  type InvoiceProject {
    id: ID!
    name: String!
    status: String!
  }

  type InvoiceItem {
    id: ID!
    description: String!
    quantity: String!
    unitPrice: String!
    total: String!
  }

  type Invoice {
    id: ID!
    clientId: ID!
    client: InvoiceClient!
    projectId: ID
    project: InvoiceProject
    invoiceNumber: String!
    subtotal: String!
    discount: String!
    tax: String!
    total: String!
    amountPaid: String!
    amountDue: String!
    currency: String!
    issueDate: DateTime!
    dueDate: DateTime
    status: InvoiceStatus!
    notes: String
    paymentCount: Int!
    items: [InvoiceItem!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type InvoiceEdge {
    cursor: String!
    node: Invoice!
  }

  type InvoiceConnection {
    edges: [InvoiceEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type InvoiceStatusSummaryItem {
    status: InvoiceStatus!
    count: Int!
  }

  type InvoiceSummary {
    total: Int!
    draftCount: Int!
    outstandingCount: Int!
    paidCount: Int!
    outstandingAmount: String!
    paidAmount: String!
    stages: [InvoiceStatusSummaryItem!]!
  }

  input InvoiceFilterInput {
    search: String
    status: InvoiceStatus
    clientId: ID
    projectId: ID
  }

  input InvoiceItemInput {
    description: String!
    quantity: Float!
    unitPrice: Float!
  }

  input CreateInvoiceInput {
    clientId: ID!
    projectId: ID
    discount: Float
    tax: Float
    currency: String
    issueDate: String!
    dueDate: String
    notes: String
    items: [InvoiceItemInput!]!
  }

  input UpdateInvoiceInput {
    clientId: ID
    projectId: ID
    discount: Float
    tax: Float
    currency: String
    issueDate: String
    dueDate: String
    notes: String
    items: [InvoiceItemInput!]
  }

  extend type Query {
    invoice(id: ID!): Invoice
    invoices(filter: InvoiceFilterInput, after: String, first: Int): InvoiceConnection!
    invoiceSummary(projectId: ID): InvoiceSummary!
  }

  extend type Mutation {
    createInvoice(input: CreateInvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: UpdateInvoiceInput!): Invoice!
    sendInvoice(id: ID!): Invoice!
    cancelInvoice(id: ID!): Invoice!
    markInvoiceOverdue(id: ID!): Invoice!
    deleteInvoice(id: ID!): Invoice!
  }
`;
