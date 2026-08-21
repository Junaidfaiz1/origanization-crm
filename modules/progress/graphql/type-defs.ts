export const progressTypeDefs = /* GraphQL */ `
  enum ProgressHealth {
    NOT_STARTED
    ON_TRACK
    AT_RISK
    DELAYED
    COMPLETED
    CANCELLED
  }

  type ProgressCounts {
    total: Int!
    completed: Int
    done: Int
  }

  type ProgressHours {
    estimated: Float!
    logged: Float!
  }

  type ProgressBudget {
    planned: String!
    actual: String!
  }

  type ProgressMilestone {
    id: ID!
    name: String!
    status: String!
    dueDate: DateTime
    order: Int!
    completed: Boolean!
  }

  type ProjectProgress {
    projectId: ID!
    name: String!
    clientId: ID!
    clientName: String!
    status: String!
    health: ProgressHealth!
    overallPercent: Float!
    milestonePercent: Float
    taskPercent: Float
    hoursPercent: Float
    budgetPercent: Float
    scheduleExpectedPercent: Float
    delayed: Boolean!
    startDate: DateTime
    endDate: DateTime
    milestones: ProgressCounts!
    tasks: ProgressCounts!
    hours: ProgressHours
    budget: ProgressBudget
    milestonesDetail: [ProgressMilestone!]
  }

  type ProjectProgressEdge {
    cursor: String!
    node: ProjectProgress!
  }

  type ProjectProgressConnection {
    edges: [ProjectProgressEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ProjectProgressOverview {
    total: Int!
    averagePercent: Float!
    onTrack: Int!
    atRisk: Int!
    delayed: Int!
    completed: Int!
    notStarted: Int!
  }

  input ProjectProgressFilterInput {
    search: String
    health: ProgressHealth
    status: ProjectStatus
  }

  extend type Query {
    projectProgress(projectId: ID!): ProjectProgress
    projectProgressList(
      filter: ProjectProgressFilterInput
      after: String
      first: Int
    ): ProjectProgressConnection!
    projectProgressOverview: ProjectProgressOverview!
  }
`;
