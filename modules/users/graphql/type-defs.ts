export const usersTypeDefs = /* GraphQL */ `
  enum MemberStatus {
    ACTIVE
    INVITED
    SUSPENDED
  }

  type WorkspaceRole {
    id: ID!
    key: String!
    name: String!
  }

  type WorkspaceMemberUser {
    id: ID!
    name: String!
    email: String!
    status: String!
    createdAt: DateTime!
  }

  type WorkspaceMember {
    id: ID!
    status: MemberStatus!
    joinedAt: DateTime!
    user: WorkspaceMemberUser!
    role: WorkspaceRole!
  }

  type WorkspaceMemberEdge {
    cursor: String!
    node: WorkspaceMember!
  }

  type WorkspaceMemberConnection {
    edges: [WorkspaceMemberEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  input WorkspaceMemberFilterInput {
    search: String
    status: MemberStatus
  }

  input InviteUserInput {
    name: String!
    email: String!
    roleKey: String!
  }

  input UpdateMemberRoleInput {
    roleKey: String!
  }

  extend type Query {
    workspaceMember(id: ID!): WorkspaceMember
    workspaceMembers(
      filter: WorkspaceMemberFilterInput
      after: String
      first: Int
    ): WorkspaceMemberConnection!
    assignableRoles: [WorkspaceRole!]!
  }

  extend type Mutation {
    inviteUser(input: InviteUserInput!): WorkspaceMember!
    updateMemberRole(id: ID!, input: UpdateMemberRoleInput!): WorkspaceMember!
    suspendMember(id: ID!): WorkspaceMember!
    resendInvite(id: ID!): WorkspaceMember!
  }
`;
