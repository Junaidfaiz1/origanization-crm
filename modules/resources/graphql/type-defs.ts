export const resourceTypeDefs = /* GraphQL */ `
  enum ResourceType {
    EMPLOYEE
    FREELANCER
  }

  enum AvailabilityStatus {
    AVAILABLE
    BUSY
    UNAVAILABLE
  }

  type ResourceUser {
    id: ID!
    name: String!
    email: String!
  }

  type ResourceSkill {
    id: ID!
    name: String!
  }

  type Resource {
    id: ID!
    userId: ID!
    user: ResourceUser!
    type: ResourceType!
    hourlyRate: String
    experienceYears: Int
    bio: String
    availabilityStatus: AvailabilityStatus!
    rating: String
    skills: [ResourceSkill!]!
    projectCount: Int!
    contractCount: Int!
    bidCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ResourceEdge {
    cursor: String!
    node: Resource!
  }

  type ResourceConnection {
    edges: [ResourceEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type ResourceAvailabilitySummaryItem {
    status: AvailabilityStatus!
    count: Int!
  }

  type ResourceSummary {
    total: Int!
    employees: Int!
    freelancers: Int!
    availability: [ResourceAvailabilitySummaryItem!]!
  }

  input ResourceFilterInput {
    search: String
    type: ResourceType
    availabilityStatus: AvailabilityStatus
    skillId: ID
  }

  input CreateResourceInput {
    userId: ID!
    type: ResourceType!
    hourlyRate: String
    experienceYears: Int
    bio: String
    availabilityStatus: AvailabilityStatus
    rating: String
    skillIds: [ID!]
  }

  input UpdateResourceInput {
    type: ResourceType
    hourlyRate: String
    experienceYears: Int
    bio: String
    availabilityStatus: AvailabilityStatus
    rating: String
    skillIds: [ID!]
  }

  extend type Query {
    resource(id: ID!): Resource
    resources(filter: ResourceFilterInput, after: String, first: Int): ResourceConnection!
    resourceSummary: ResourceSummary!
  }

  extend type Mutation {
    createResource(input: CreateResourceInput!): Resource!
    updateResource(id: ID!, input: UpdateResourceInput!): Resource!
    deleteResource(id: ID!): Resource!
  }
`;
