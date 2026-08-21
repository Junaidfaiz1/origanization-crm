export const expenseTypeDefs = /* GraphQL */ `
  enum ExpenseStatus {
    PENDING
    APPROVED
    REJECTED
  }

  type ExpenseProject {
    id: ID!
    name: String!
    status: String!
    clientName: String!
  }

  type ExpenseSubmitter {
    id: ID!
    name: String!
    email: String!
  }

  type Expense {
    id: ID!
    projectId: ID!
    project: ExpenseProject!
    category: String!
    description: String
    amount: String!
    currency: String!
    date: DateTime!
    submittedById: ID!
    submittedBy: ExpenseSubmitter!
    status: ExpenseStatus!
    receiptFileId: ID
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ExpenseEdge {
    cursor: String!
    node: Expense!
  }

  type ExpenseConnection {
    edges: [ExpenseEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ExpenseStatusSummaryItem {
    status: ExpenseStatus!
    count: Int!
  }

  type ExpenseSummary {
    total: Int!
    pendingCount: Int!
    approvedCount: Int!
    rejectedCount: Int!
    pendingAmount: String!
    approvedAmount: String!
    stages: [ExpenseStatusSummaryItem!]!
  }

  input ExpenseFilterInput {
    search: String
    status: ExpenseStatus
    projectId: ID
    category: String
  }

  input CreateExpenseInput {
    projectId: ID!
    category: String!
    description: String
    amount: String!
    currency: String
    date: String!
  }

  input UpdateExpenseInput {
    projectId: ID
    category: String
    description: String
    amount: String
    currency: String
    date: String
  }

  input UpdateExpenseStatusInput {
    status: ExpenseStatus!
  }

  extend type Query {
    expense(id: ID!): Expense
    expenses(filter: ExpenseFilterInput, after: String, first: Int): ExpenseConnection!
    expenseSummary(projectId: ID): ExpenseSummary!
  }

  extend type Mutation {
    createExpense(input: CreateExpenseInput!): Expense!
    updateExpense(id: ID!, input: UpdateExpenseInput!): Expense!
    updateExpenseStatus(id: ID!, input: UpdateExpenseStatusInput!): Expense!
    deleteExpense(id: ID!): Expense!
  }
`;
