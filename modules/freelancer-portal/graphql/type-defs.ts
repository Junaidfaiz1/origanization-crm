export const freelancerPortalTypeDefs = /* GraphQL */ `
  type FreelancerPortalProfile {
    id: ID!
    name: String!
    email: String!
    type: String!
    hourlyRate: String
    experienceYears: Int
    availabilityStatus: String!
    rating: String
    bio: String
    skills: [FreelancerPortalSkill!]!
  }

  type FreelancerPortalSkill {
    id: ID!
    name: String!
  }

  type FreelancerPortalHomeCounts {
    openRequests: Int!
    myBids: Int!
    activeTasks: Int!
  }

  type FreelancerPortalHomeRequest {
    id: ID!
    title: String!
    projectName: String!
    status: String!
    budgetMin: String
    budgetMax: String
    currency: String!
    endsAt: DateTime
  }

  type FreelancerPortalHomeBid {
    id: ID!
    title: String!
    status: String!
    amount: String!
    currency: String!
    estimatedDays: Int!
  }

  type FreelancerPortalHomeTask {
    id: ID!
    title: String!
    status: String!
    priority: String!
    projectName: String!
    dueDate: DateTime
  }

  type FreelancerPortalHome {
    profile: FreelancerPortalProfile
    counts: FreelancerPortalHomeCounts!
    openRequests: [FreelancerPortalHomeRequest!]!
    myBids: [FreelancerPortalHomeBid!]!
    myTasks: [FreelancerPortalHomeTask!]!
  }

  extend type Query {
    freelancerPortalHome: FreelancerPortalHome!
  }
`;
