/**
 * Static marketing demo data only.
 * Never import Prisma, GraphQL, or live CRM services here.
 */

export const marketingDemoData = {
  label: "Demo data",
  workspaceLabel: "Sample workspace",
  revenue: 248_420,
  revenueDelta: 18.6,
  expenses: 169_300,
  grossProfit: 79_120,
  profitMargin: 31.8,
  outstanding: 24_800,
  projects: 128,
  activeProjects: 32,
  clients: 64,
  proposals: 342,
  winRate: 68.4,
  pipeline: 482_900,
  avgDealSize: 42_800,
  teamUtilization: 78,
  mrr: 86_400,
  clientGrowth: 12.4,

  client: {
    name: "Acme Digital",
    industry: "Technology",
    status: "Active",
    ltv: 84_500,
    projects: 18,
    satisfaction: 94,
    contact: "Jordan Hale",
    email: "jordan@acme.demo",
    phone: "+1 (415) 555-0142",
    health: "Strong",
  },

  pipelineCards: [
    { column: "New Lead", name: "Acme Corp", value: 42_000 },
    { column: "Qualified", name: "Nova Systems", value: 28_500 },
    { column: "Proposal", name: "Vertex Labs", value: 18_200 },
    { column: "Negotiation", name: "Orbit Digital", value: 64_000 },
    { column: "Won", name: "Helix Studio", value: 51_200 },
    { column: "Lost", name: "Northwind Co", value: 12_000 },
  ],

  bid: {
    platform: "Upwork",
    project: "SaaS Dashboard Development",
    budget: "$12,000 – $18,000",
    competition: "Medium",
    matchScore: 94,
    status: "Draft",
  },

  proposal: {
    title: "Enterprise CRM Transformation",
    client: "Acme Corporation",
    value: 48_500,
    timeline: "12 weeks",
    sections: [
      "Executive Summary",
      "Scope",
      "Deliverables",
      "Timeline",
      "Investment",
      "Terms",
    ],
  },

  project: {
    name: "Acme Platform Rebuild",
    progress: 72,
    tasksDone: 34,
    tasksTotal: 48,
    budgetUsed: 31_500,
    budgetTotal: 42_000,
    team: 6,
    deadline: "18 Sep 2026",
  },

  profitability: [
    {
      name: "Project A",
      revenue: 42_000,
      cost: 26_000,
      profit: 16_000,
      margin: 38,
    },
    {
      name: "Project B",
      revenue: 18_000,
      cost: 14_000,
      profit: 4_000,
      margin: 22,
    },
    {
      name: "Project C",
      revenue: 67_000,
      cost: 39_000,
      profit: 28_000,
      margin: 42,
    },
  ],

  team: [
    {
      name: "Sarah Khan",
      role: "Project Manager",
      utilization: 86,
      tasks: 11,
      availability: "Busy",
    },
    {
      name: "Ahmed Raza",
      role: "Senior Developer",
      utilization: 92,
      tasks: 14,
      availability: "Focused",
    },
    {
      name: "Ali Hassan",
      role: "UI/UX Designer",
      utilization: 74,
      tasks: 8,
      availability: "Open",
    },
    {
      name: "Emma Wilson",
      role: "Account Manager",
      utilization: 68,
      tasks: 6,
      availability: "Open",
    },
  ],

  activity: [
    { time: "09:14", text: "Proposal sent to Acme Corporation" },
    { time: "10:02", text: "Bid shortlisted for SaaS dashboard" },
    { time: "11:40", text: "Invoice INV-2048 marked paid" },
    { time: "14:18", text: "Milestone “Design system” completed" },
    { time: "16:55", text: "New lead: Vertex Labs" },
  ],

  recentProjects: [
    { name: "Acme Platform", status: "In progress", progress: 72 },
    { name: "Orbit Rebrand", status: "Review", progress: 91 },
    { name: "Helix Mobile", status: "Planning", progress: 18 },
  ],

  recentProposals: [
    { name: "CRM Transformation", value: 48_500, status: "Sent" },
    { name: "Analytics Suite", value: 32_000, status: "Draft" },
    { name: "Portal Expansion", value: 21_400, status: "Won" },
  ],

  invoices: [
    { id: "INV-2048", client: "Acme Digital", amount: 12_400, status: "Paid" },
    { id: "INV-2051", client: "Orbit Digital", amount: 8_200, status: "Sent" },
    {
      id: "INV-2053",
      client: "Vertex Labs",
      amount: 4_200,
      status: "Overdue",
    },
  ],

  caseStudies: [
    {
      label: "Demo case study",
      segment: "Digital Agency",
      headline: "From scattered tools to one delivery rhythm",
      metrics: [
        { label: "Revenue", value: "+34%" },
        { label: "Proposal win rate", value: "+21%" },
      ],
    },
    {
      label: "Demo case study",
      segment: "Software House",
      headline: "Protecting margin across every engagement",
      metrics: [
        { label: "Project margin", value: "+18%" },
        { label: "Utilization", value: "+11%" },
      ],
    },
    {
      label: "Demo case study",
      segment: "Consulting Firm",
      headline: "Less admin, more billable expertise",
      metrics: [
        { label: "Admin time", value: "−42%" },
        { label: "Pipeline clarity", value: "+29%" },
      ],
    },
  ],

  articles: [
    {
      slug: "agency-profitability",
      title: "How modern agencies manage profitability",
      excerpt: "Connect delivery cost to revenue before the quarter ends.",
    },
    {
      slug: "sales-pipeline",
      title: "How to build a better sales pipeline",
      excerpt: "Fewer stages, clearer ownership, faster decisions.",
    },
    {
      slug: "proposal-mistakes",
      title: "Proposal mistakes that cost agencies deals",
      excerpt: "Scope ambiguity and weak investment framing.",
    },
    {
      slug: "project-margin",
      title: "How to measure project margin",
      excerpt: "Revenue minus cost — with time and expenses included.",
    },
    {
      slug: "crm-vs-pm",
      title: "CRM vs project management software",
      excerpt: "Why service businesses eventually need both — unified.",
    },
  ],

  revenueSeries: [42, 48, 51, 55, 62, 70, 74, 81, 88, 92, 98, 110],
  pipelineSeries: [120, 132, 128, 145, 160, 155, 172, 180, 190, 205, 198, 220],
} as const;

export function formatDemoMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDemoPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}
