export const biddingTypeDefs = /* GraphQL */ `
  enum BidRequestStatus {
    DRAFT
    OPEN
    PAUSED
    CLOSED
    AWARDED
    CANCELLED
  }

  enum BidRequestType {
    INTERNAL
    EXTERNAL
  }

  enum BidStatus {
    DRAFT
    SUBMITTED
    SHORTLISTED
    NEGOTIATION
    ACCEPTED
    REJECTED
    WITHDRAWN
  }

  enum BidNegotiationStatus {
    OFFER
    COUNTER_OFFER
    ACCEPTED
    REJECTED
    WITHDRAWN
  }

  type BidRequestProject {
    id: ID!
    name: String!
    status: String!
    clientName: String!
  }

  type BidRequestCreator {
    id: ID!
    name: String!
    email: String!
  }

  type AwardedBidSummary {
    id: ID!
    amount: String
    estimatedDays: Int!
    bidder: BidRequestCreator!
  }

  type BidRequest {
    id: ID!
    projectId: ID!
    project: BidRequestProject!
    title: String!
    description: String
    budgetMin: String
    budgetMax: String
    currency: String!
    deadline: DateTime
    biddingType: BidRequestType!
    status: BidRequestStatus!
    startsAt: DateTime
    endsAt: DateTime
    createdById: ID!
    createdBy: BidRequestCreator!
    awardedBidId: ID
    awardedBid: AwardedBidSummary
    bidCount: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BidRequestEdge {
    cursor: String!
    node: BidRequest!
  }

  type BidRequestConnection {
    edges: [BidRequestEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BidSkill {
    id: ID!
    name: String!
  }

  type BidResource {
    id: ID!
    type: String!
    hourlyRate: String
    experienceYears: Int
    rating: String
    availabilityStatus: String!
    skills: [BidSkill!]!
  }

  type BidNegotiation {
    id: ID!
    senderId: ID!
    sender: BidRequestCreator!
    amount: String
    estimatedDays: Int!
    message: String
    status: BidNegotiationStatus!
    createdAt: DateTime!
  }

  type BidScore {
    total: Int!
    price: Float!
    experience: Float!
    rating: Float!
    delivery: Float!
  }

  type Bid {
    id: ID!
    bidRequestId: ID!
    bidRequest: BidRequestRef!
    bidderId: ID!
    bidder: BidRequestCreator!
    resourceId: ID
    resource: BidResource
    amount: String!
    estimatedDays: Int!
    proposal: String
    status: BidStatus!
    submittedAt: DateTime
    negotiations: [BidNegotiation!]!
    score: BidScore
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type BidRequestRef {
    id: ID!
    title: String!
    status: BidRequestStatus!
    awardedBidId: ID
    currency: String!
    projectId: ID!
    project: BidRequestProjectName!
  }

  type BidRequestProjectName {
    id: ID!
    name: String!
  }

  type BidEdge {
    cursor: String!
    node: Bid!
  }

  type BidConnection {
    edges: [BidEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BidComparison {
    request: BidRequest!
    bids: [Bid!]!
  }

  type BiddingSummary {
    openRequests: Int!
    awardedRequests: Int!
    submittedBids: Int!
  }

  input BidRequestFilterInput {
    search: String
    status: BidRequestStatus
    projectId: ID
  }

  input BidFilterInput {
    bidRequestId: ID
    status: BidStatus
    mineOnly: Boolean
  }

  input CreateBidRequestInput {
    projectId: ID!
    title: String!
    description: String
    budgetMin: String
    budgetMax: String
    currency: String
    deadline: String
    biddingType: BidRequestType
    startsAt: String
    endsAt: String
  }

  input UpdateBidRequestInput {
    projectId: ID
    title: String
    description: String
    budgetMin: String
    budgetMax: String
    currency: String
    deadline: String
    biddingType: BidRequestType
    startsAt: String
    endsAt: String
  }

  input SubmitBidInput {
    bidRequestId: ID!
    amount: String!
    estimatedDays: Int!
    proposal: String
  }

  input UpdateBidInput {
    amount: String
    estimatedDays: Int
    proposal: String
  }

  input NegotiateBidInput {
    amount: String!
    estimatedDays: Int!
    message: String
  }

  extend type Query {
    bidRequest(id: ID!): BidRequest
    bidRequests(filter: BidRequestFilterInput, after: String, first: Int): BidRequestConnection!
    bid(id: ID!): Bid
    bids(filter: BidFilterInput, after: String, first: Int): BidConnection!
    bidComparison(bidRequestId: ID!): BidComparison!
    biddingSummary: BiddingSummary!
  }

  extend type Mutation {
    createBidRequest(input: CreateBidRequestInput!): BidRequest!
    updateBidRequest(id: ID!, input: UpdateBidRequestInput!): BidRequest!
    openBidRequest(id: ID!): BidRequest!
    pauseBidRequest(id: ID!): BidRequest!
    closeBidRequest(id: ID!): BidRequest!
    cancelBidRequest(id: ID!): BidRequest!
    submitBid(input: SubmitBidInput!): Bid!
    updateMyBid(id: ID!, input: UpdateBidInput!): Bid!
    withdrawBid(id: ID!): Bid!
    shortlistBid(id: ID!): Bid!
    rejectBid(id: ID!): Bid!
    negotiateBid(id: ID!, input: NegotiateBidInput!): Bid!
    acceptBid(id: ID!): Bid!
  }
`;
