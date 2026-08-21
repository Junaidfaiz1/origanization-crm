export const teamTypeDefs = /* GraphQL */ `
  enum TeamResourceType {
    EMPLOYEE
    FREELANCER
  }

  type TeamMemberProject {
    id: ID!
    name: String!
    status: String!
    clientId: ID!
    clientName: String!
  }

  type TeamMemberResourceUser {
    id: ID!
    name: String!
    email: String!
  }

  type TeamMemberResource {
    id: ID!
    type: TeamResourceType!
    availabilityStatus: String!
    hourlyRate: String
    user: TeamMemberResourceUser!
  }

  type ProjectTeamMember {
    id: ID!
    projectId: ID!
    project: TeamMemberProject!
    resourceId: ID!
    resource: TeamMemberResource!
    role: String
    assignedAt: DateTime!
  }

  type TeamMemberEdge {
    cursor: String!
    node: ProjectTeamMember!
  }

  type TeamMemberConnection {
    edges: [TeamMemberEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TeamSummary {
    total: Int!
    employeeCount: Int!
    freelancerCount: Int!
  }

  input TeamFilterInput {
    search: String
    projectId: ID
    resourceId: ID
    type: TeamResourceType
  }

  input AssignTeamMemberInput {
    projectId: ID!
    resourceId: ID!
    role: String
  }

  input UpdateTeamMemberInput {
    role: String
  }

  extend type Query {
    teamMember(id: ID!): ProjectTeamMember
    teamMembers(filter: TeamFilterInput, after: String, first: Int): TeamMemberConnection!
    teamSummary(projectId: ID): TeamSummary!
  }

  extend type Mutation {
    assignTeamMember(input: AssignTeamMemberInput!): ProjectTeamMember!
    updateTeamMember(id: ID!, input: UpdateTeamMemberInput!): ProjectTeamMember!
    removeTeamMember(id: ID!): ProjectTeamMember!
  }
`;
