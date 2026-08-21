export const timeTrackingTypeDefs = /* GraphQL */ `
  type TimeEntryProject {
    id: ID!
    name: String!
    status: String!
    clientName: String!
  }

  type TimeEntryTask {
    id: ID!
    title: String!
    projectId: ID!
  }

  type TimeEntryUser {
    id: ID!
    name: String!
    email: String!
  }

  type TimeEntry {
    id: ID!
    projectId: ID!
    project: TimeEntryProject!
    taskId: ID
    task: TimeEntryTask
    userId: ID!
    user: TimeEntryUser!
    startedAt: DateTime!
    endedAt: DateTime
    durationSeconds: Int
    hourlyRate: String
    billable: Boolean!
    notes: String
    running: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TimeEntryEdge {
    cursor: String!
    node: TimeEntry!
  }

  type TimeEntryConnection {
    edges: [TimeEntryEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TimeEntrySummary {
    totalEntries: Int!
    runningCount: Int!
    totalSeconds: Int!
    billableSeconds: Int!
    nonBillableSeconds: Int!
  }

  input TimeEntryFilterInput {
    search: String
    projectId: ID
    taskId: ID
    userId: ID
    billable: Boolean
    runningOnly: Boolean
  }

  input CreateTimeEntryInput {
    projectId: ID!
    taskId: ID
    userId: ID
    startedAt: String!
    endedAt: String
    hourlyRate: String
    billable: Boolean
    notes: String
  }

  input UpdateTimeEntryInput {
    projectId: ID
    taskId: ID
    startedAt: String
    endedAt: String
    hourlyRate: String
    billable: Boolean
    notes: String
  }

  input StartTimerInput {
    projectId: ID!
    taskId: ID
    billable: Boolean
    notes: String
  }

  extend type Query {
    timeEntry(id: ID!): TimeEntry
    timeEntries(filter: TimeEntryFilterInput, after: String, first: Int): TimeEntryConnection!
    activeTimeEntry: TimeEntry
    timeEntrySummary(projectId: ID): TimeEntrySummary!
  }

  extend type Mutation {
    createTimeEntry(input: CreateTimeEntryInput!): TimeEntry!
    updateTimeEntry(id: ID!, input: UpdateTimeEntryInput!): TimeEntry!
    deleteTimeEntry(id: ID!): TimeEntry!
    startTimer(input: StartTimerInput!): TimeEntry!
    stopTimeEntry(id: ID!): TimeEntry!
  }
`;
