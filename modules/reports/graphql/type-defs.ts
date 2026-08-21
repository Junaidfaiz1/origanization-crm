export const reportTypeDefs = /* GraphQL */ `
  type ReportStatusCount {
    status: String!
    count: Int!
  }

  type ReportStageValue {
    stage: String!
    count: Int!
    value: String!
  }

  type SalesLeadReport {
    total: Int!
    converted: Int!
    lost: Int!
    conversionRate: String
    byStatus: [ReportStatusCount!]!
  }

  type SalesPipelineReport {
    openCount: Int!
    wonCount: Int!
    lostCount: Int!
    pipelineValue: String!
    weightedValue: String!
    winRate: String
    stages: [ReportStageValue!]!
  }

  type SalesProposalReport {
    total: Int!
    accepted: Int!
    rejected: Int!
    pending: Int!
  }

  type SalesReport {
    leads: SalesLeadReport!
    pipeline: SalesPipelineReport!
    proposals: SalesProposalReport!
  }

  type DelayedProjectReport {
    id: ID!
    name: String!
    status: String!
    endDate: DateTime
  }

  type ProjectsReport {
    total: Int!
    active: Int!
    completed: Int!
    delayed: Int!
    budgetTotal: String!
    profit: String!
    profitMargin: String!
    byStatus: [ReportStatusCount!]!
    delayedProjects: [DelayedProjectReport!]!
  }

  type BiddingRequestsReport {
    total: Int!
    open: Int!
    awarded: Int!
    conversionRate: String
    byStatus: [ReportStatusCount!]!
  }

  type BiddingBidsReport {
    total: Int!
    accepted: Int!
    rejected: Int!
    averageAmount: String!
    averageDays: Float!
  }

  type BiddingReport {
    requests: BiddingRequestsReport!
    bids: BiddingBidsReport!
  }

  type FinanceAmountBucket {
    status: String!
    count: Int!
    amount: String!
  }

  type FinanceInvoiceBucket {
    status: String!
    count: Int!
    total: String!
    amountDue: String!
    amountPaid: String!
  }

  type FinanceReport {
    revenue: String!
    resourceCost: String!
    expenses: String!
    paymentFees: String!
    profit: String!
    profitMargin: String!
    outstandingDue: String!
    payments: [FinanceAmountBucket!]!
    expensesByStatus: [FinanceAmountBucket!]!
    invoices: [FinanceInvoiceBucket!]!
  }

  type ReportMoneyPoint {
    label: String!
    amount: Float!
  }

  type ReportCountPoint {
    label: String!
    count: Int!
  }

  type ReportStagePoint {
    label: String!
    count: Int!
    value: Float!
  }

  type ReportCharts {
    revenueByMonth: [ReportMoneyPoint!]!
    pipelineByStage: [ReportStagePoint!]!
    bidConversion: [ReportCountPoint!]!
    financeBreakdown: [ReportMoneyPoint!]!
    leadsByStatus: [ReportCountPoint!]!
    projectsByStatus: [ReportCountPoint!]!
    bidsByStatus: [ReportCountPoint!]!
    windowRevenue: String!
  }

  type ReportsOverview {
    sales: SalesReport!
    projects: ProjectsReport!
    bidding: BiddingReport!
    finance: FinanceReport!
    charts: ReportCharts!
  }

  type DashboardMetrics {
    canViewFinance: Boolean!
    revenue: String
    profit: String
    profitMargin: String
    activeProjects: Int
    openBids: Int
    pendingProposals: Int
    outstandingInvoices: Int
    overdueInvoices: Int
    leadsCount: Int
    openOpportunities: Int
    pipelineValue: String
    myOpenTasks: Int
    upcomingMilestones: Int
  }

  extend type Query {
    reportsOverview: ReportsOverview!
    salesReport: SalesReport!
    projectsReport: ProjectsReport!
    biddingReport: BiddingReport!
    financeReport: FinanceReport!
    reportCharts: ReportCharts!
    dashboardMetrics: DashboardMetrics!
  }
`;
