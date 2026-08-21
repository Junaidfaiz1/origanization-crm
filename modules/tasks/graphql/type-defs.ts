export const taskTypeDefs = /* GraphQL */ `
  enum TaskStatus {
    TODO
    IN_PROGRESS
    IN_REVIEW
    BLOCKED
    DONE
  }

  enum TaskPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  type TaskProject {
    id: ID!
    name: String!
    status: String!
    clientName: String!
  }

  type TaskMilestone {
    id: ID!
    name: String!
    projectId: ID!
  }

  type TaskAssignee {
    id: ID!
    name: String!
    email: String!
  }

  type Task {
    id: ID!
    projectId: ID!
    project: TaskProject!
    milestoneId: ID
    milestone: TaskMilestone
    assignedToId: ID
    assignedTo: TaskAssignee
    title: String!
    description: String
    priority: TaskPriority!
    status: TaskStatus!
    dueDate: DateTime
    estimatedHours: String
    actualHours: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type TaskEdge {
    cursor: String!
    node: Task!
  }

  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TaskKanbanColumn {
    status: TaskStatus!
    tasks: [Task!]!
  }

  type TaskKanbanBoard {
    columns: [TaskKanbanColumn!]!
    totalCount: Int!
  }

  type TaskStatusSummaryItem {
    status: TaskStatus!
    count: Int!
  }

  type TaskStatusSummary {
    total: Int!
    openCount: Int!
    stages: [TaskStatusSummaryItem!]!
    priorities: TaskPriorityCounts!
  }

  type TaskPriorityCounts {
    URGENT: Int!
    HIGH: Int!
  }

  input TaskFilterInput {
    search: String
    status: TaskStatus
    priority: TaskPriority
    projectId: ID
    milestoneId: ID
    assignedToId: ID
    mineOnly: Boolean
  }

  input CreateTaskInput {
    projectId: ID!
    milestoneId: ID
    assignedToId: ID
    title: String!
    description: String
    priority: TaskPriority
    status: TaskStatus
    dueDate: String
    estimatedHours: String
    actualHours: String
  }

  input UpdateTaskInput {
    projectId: ID
    milestoneId: ID
    assignedToId: ID
    title: String
    description: String
    priority: TaskPriority
    status: TaskStatus
    dueDate: String
    estimatedHours: String
    actualHours: String
  }

  input UpdateTaskStatusInput {
    status: TaskStatus!
  }

  extend type Query {
    task(id: ID!): Task
    tasks(filter: TaskFilterInput, after: String, first: Int): TaskConnection!
    taskKanban(filter: TaskFilterInput): TaskKanbanBoard!
    taskStatusSummary(projectId: ID): TaskStatusSummary!
  }

  extend type Mutation {
    createTask(input: CreateTaskInput!): Task!
    updateTask(id: ID!, input: UpdateTaskInput!): Task!
    updateTaskStatus(id: ID!, input: UpdateTaskStatusInput!): Task!
    deleteTask(id: ID!): Task!
  }
`;
