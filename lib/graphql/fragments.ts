export const userFields = /* GraphQL */ `
  fragment UserFields on User {
    id
    name
    email
    avatar
    roleKey
    roleName
    permissions
    organization {
      id
      name
      slug
      currency
    }
  }
`;

export const leadFields = /* GraphQL */ `
  fragment LeadFields on Lead {
    id
    name
    email
    phone
    companyName
    source
    estimatedValue
    status
    assignedToId
    assignedTo {
      id
      name
      email
    }
    notes
    convertedClientId
    archivedAt
    createdAt
    updatedAt
  }
`;

export const companyFields = /* GraphQL */ `
  fragment CompanyFields on Company {
    id
    name
    website
    industry
    address
    city
    country
    contactCount
    clientCount
    archivedAt
    createdAt
    updatedAt
  }
`;

export const contactFields = /* GraphQL */ `
  fragment ContactFields on Contact {
    id
    companyId
    company {
      id
      name
    }
    name
    email
    phone
    designation
    primaryClientCount
    archivedAt
    createdAt
    updatedAt
  }
`;

export const clientFields = /* GraphQL */ `
  fragment ClientFields on Client {
    id
    companyId
    company {
      id
      name
    }
    primaryContactId
    primaryContact {
      id
      name
      email
    }
    status
    notes
    opportunityCount
    projectCount
    proposalCount
    archivedAt
    createdAt
    updatedAt
  }
`;

export const opportunityFields = /* GraphQL */ `
  fragment OpportunityFields on Opportunity {
    id
    clientId
    client {
      id
      companyName
      companyId
    }
    name
    description
    estimatedValue
    probability
    weightedValue
    expectedCloseDate
    stage
    assignedToId
    assignedTo {
      id
      name
      email
    }
    proposalCount
    projectCount
    archivedAt
    createdAt
    updatedAt
  }
`;

export const projectFields = /* GraphQL */ `
  fragment ProjectFields on Project {
    id
    clientId
    client {
      id
      companyName
      companyId
    }
    opportunityId
    opportunity {
      id
      name
    }
    proposalId
    proposal {
      id
      title
    }
    name
    description
    budget
    estimatedCost
    actualCost
    startDate
    endDate
    status
    managerId
    manager {
      id
      name
      email
    }
    bidRequestCount
    milestoneCount
    taskCount
    memberCount
    archivedAt
    createdAt
    updatedAt
  }
`;

export const proposalFields = /* GraphQL */ `
  fragment ProposalFields on Proposal {
    id
    opportunityId
    opportunity {
      id
      name
    }
    clientId
    client {
      id
      companyName
      companyId
    }
    title
    description
    subtotal
    discount
    tax
    total
    currency
    validUntil
    status
    createdById
    createdBy {
      id
      name
      email
    }
    sentAt
    acceptedAt
    rejectedAt
    projectCount
    items {
      id
      description
      quantity
      unitPrice
      total
    }
    archivedAt
    createdAt
    updatedAt
  }
`;

export const milestoneFields = /* GraphQL */ `
  fragment MilestoneFields on Milestone {
    id
    projectId
    project {
      id
      name
      status
      clientId
      clientName
    }
    name
    description
    amount
    dueDate
    status
    order
    taskCount
    createdAt
    updatedAt
  }
`;

export const taskFields = /* GraphQL */ `
  fragment TaskFields on Task {
    id
    projectId
    project {
      id
      name
      status
      clientName
    }
    milestoneId
    milestone {
      id
      name
      projectId
    }
    assignedToId
    assignedTo {
      id
      name
      email
    }
    title
    description
    priority
    status
    dueDate
    estimatedHours
    actualHours
    createdAt
    updatedAt
  }
`;

export const resourceFields = /* GraphQL */ `
  fragment ResourceFields on Resource {
    id
    userId
    user {
      id
      name
      email
    }
    type
    hourlyRate
    experienceYears
    bio
    availabilityStatus
    rating
    skills {
      id
      name
    }
    projectCount
    contractCount
    bidCount
    createdAt
    updatedAt
  }
`;

export const timeEntryFields = /* GraphQL */ `
  fragment TimeEntryFields on TimeEntry {
    id
    projectId
    project {
      id
      name
      status
      clientName
    }
    taskId
    task {
      id
      title
      projectId
    }
    userId
    user {
      id
      name
      email
    }
    startedAt
    endedAt
    durationSeconds
    hourlyRate
    billable
    notes
    running
    createdAt
    updatedAt
  }
`;

export const expenseFields = /* GraphQL */ `
  fragment ExpenseFields on Expense {
    id
    projectId
    project {
      id
      name
      status
      clientName
    }
    category
    description
    amount
    currency
    date
    submittedById
    submittedBy {
      id
      name
      email
    }
    status
    receiptFileId
    createdAt
    updatedAt
  }
`;

export const contractFields = /* GraphQL */ `
  fragment ContractFields on Contract {
    id
    projectId
    project {
      id
      name
      status
      clientName
    }
    clientId
    client {
      id
      name
    }
    resourceId
    resource {
      id
      name
      email
    }
    bidId
    bid {
      id
      amount
      status
    }
    title
    content
    totalAmount
    currency
    startDate
    endDate
    status
    signedAt
    createdAt
    updatedAt
  }
`;

export const invoiceFields = /* GraphQL */ `
  fragment InvoiceFields on Invoice {
    id
    clientId
    client {
      id
      companyName
      companyId
    }
    projectId
    project {
      id
      name
      status
    }
    invoiceNumber
    subtotal
    discount
    tax
    total
    amountPaid
    amountDue
    currency
    issueDate
    dueDate
    status
    notes
    paymentCount
    items {
      id
      description
      quantity
      unitPrice
      total
    }
    createdAt
    updatedAt
  }
`;

export const paymentFields = /* GraphQL */ `
  fragment PaymentFields on Payment {
    id
    invoiceId
    invoice {
      id
      invoiceNumber
      status
      total
      amountPaid
      amountDue
      currency
      clientName
      clientId
      projectId
      projectName
    }
    amount
    currency
    provider
    providerPaymentId
    status
    method
    notes
    paidAt
    createdAt
    updatedAt
  }
`;
