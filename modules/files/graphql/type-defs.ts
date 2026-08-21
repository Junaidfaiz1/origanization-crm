export const fileTypeDefs = /* GraphQL */ `
  enum FileEntityType {
    Project
    ProjectRequirement
    Expense
  }

  type FileUploader {
    id: ID!
    name: String!
    email: String!
  }

  type StoredFile {
    id: ID!
    entityType: String!
    entityId: ID!
    fileName: String!
    mimeType: String!
    size: Int!
    uploadedBy: FileUploader!
    createdAt: DateTime!
  }

  type FileEdge {
    cursor: String!
    node: StoredFile!
  }

  type FileConnection {
    edges: [FileEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type FileDownloadUrl {
    url: String!
    fileName: String!
    mimeType: String!
    mode: String!
  }

  type FileSummary {
    total: Int!
    totalBytes: Int!
    projectCount: Int!
  }

  input FileFilterInput {
    search: String
    entityType: FileEntityType
    entityId: ID
    projectId: ID
  }

  extend type Query {
    file(id: ID!): StoredFile
    files(filter: FileFilterInput, after: String, first: Int): FileConnection!
    fileDownloadUrl(id: ID!): FileDownloadUrl!
    fileSummary(projectId: ID): FileSummary!
  }

  extend type Mutation {
    deleteFile(id: ID!): StoredFile!
  }
`;
