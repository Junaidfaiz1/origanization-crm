export const notificationTypeDefs = /* GraphQL */ `
  type Notification {
    id: ID!
    type: String!
    title: String!
    message: String!
    entityType: String
    entityId: ID
    href: String
    readAt: DateTime
    unread: Boolean!
    createdAt: DateTime!
  }

  type NotificationEdge {
    cursor: String!
    node: Notification!
  }

  type NotificationConnection {
    edges: [NotificationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input NotificationFilterInput {
    unreadOnly: Boolean
    type: String
  }

  extend type Query {
    notification(id: ID!): Notification
    notifications(
      filter: NotificationFilterInput
      after: String
      first: Int
    ): NotificationConnection!
    unreadNotificationCount: Int!
  }

  extend type Mutation {
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Int!
  }
`;
