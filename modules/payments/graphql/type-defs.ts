export const paymentTypeDefs = /* GraphQL */ `
  enum PaymentStatus {
    PENDING
    SUCCEEDED
    FAILED
    REFUNDED
  }

  enum PaymentProvider {
    STRIPE
    MANUAL
  }

  enum PaymentMethod {
    BANK_TRANSFER
    CASH
    CHEQUE
    OTHER
  }

  type PaymentInvoice {
    id: ID!
    invoiceNumber: String!
    status: String!
    total: String!
    amountPaid: String!
    amountDue: String!
    currency: String!
    clientName: String!
    clientId: ID!
    projectId: ID
    projectName: String
  }

  type Payment {
    id: ID!
    invoiceId: ID!
    invoice: PaymentInvoice!
    amount: String!
    currency: String!
    provider: PaymentProvider!
    providerPaymentId: String
    status: PaymentStatus!
    method: PaymentMethod
    notes: String
    paidAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PaymentEdge {
    cursor: String!
    node: Payment!
  }

  type PaymentConnection {
    edges: [PaymentEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PaymentStatusSummaryItem {
    status: PaymentStatus!
    count: Int!
  }

  type PaymentSummary {
    total: Int!
    succeededCount: Int!
    refundedCount: Int!
    succeededAmount: String!
    refundedAmount: String!
    stages: [PaymentStatusSummaryItem!]!
  }

  input PaymentFilterInput {
    search: String
    status: PaymentStatus
    invoiceId: ID
    method: PaymentMethod
  }

  input RecordPaymentInput {
    invoiceId: ID!
    amount: String!
    currency: String
    method: PaymentMethod!
    reference: String
    paidAt: String!
    notes: String
  }

  extend type Query {
    payment(id: ID!): Payment
    payments(filter: PaymentFilterInput, after: String, first: Int): PaymentConnection!
    paymentSummary(invoiceId: ID): PaymentSummary!
  }

  extend type Mutation {
    recordPayment(input: RecordPaymentInput!): Payment!
    voidPayment(id: ID!): Payment!
  }
`;
