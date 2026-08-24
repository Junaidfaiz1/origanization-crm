/** Honest product copy — only claim capabilities that exist. Demo stats live in demo-data.ts. */

export const BRAND = {
  name: "Technova",
  legalName: "Technova CRM",
  tagline: "One workspace for winning clients, delivering projects, and understanding your business.",
  pitch:
    "Technova brings CRM, bidding, projects, contracts, finance and profitability into one intelligent workspace.",
} as const;

export const HOME_FAQ = [
  {
    q: "Who is Technova for?",
    a: "Software houses, digital agencies, consulting teams, freelancers, and service businesses that sell work, staff teams, deliver projects, and get paid.",
  },
  {
    q: "Does bidding expose competing rates?",
    a: "No. Freelancers see their own bids and eligible requests. Competing private bid amounts stay private. Clients never see bidding internals or freelancer costs.",
  },
  {
    q: "Can clients and freelancers use the same workspace?",
    a: "They use dedicated portals. Clients see progress, milestones, deliverables, and invoices. Freelancers see requests, their bids, assigned work, and time — not agency margin.",
  },
  {
    q: "Is finance built in?",
    a: "Yes — invoices, payments, expenses, and project-level cost views. Profitability is calculated from revenue, resource cost, expenses, and fees where available.",
  },
  {
    q: "How does multi-tenancy work?",
    a: "Every organization is isolated. Users only access their organization’s records. Permissions control who can view finance, accept bids, or manage members.",
  },
] as const;

export const SECURITY_POINTS = [
  {
    title: "Multi-tenant architecture",
    body: "Org-owned records are scoped by organization from the authenticated session — not from client-supplied tenant IDs.",
  },
  {
    title: "Role-based access",
    body: "Permissions are checked on the server for CRM, projects, bidding, invoices, reports, and settings.",
  },
  {
    title: "Secure authentication",
    body: "Credential login with hashed passwords and HttpOnly session cookies. Invite and password-reset flows are tokenized.",
  },
  {
    title: "Audit logs",
    body: "Important create, update, status, money, and permission changes can be recorded for accountability.",
  },
  {
    title: "Encrypted storage & protected APIs",
    body: "Files go through a storage abstraction; GraphQL APIs authorize every sensitive mutation.",
  },
  {
    title: "Secure payments",
    body: "Payment success is intended to come from provider webhooks as source of truth — not the browser alone.",
  },
] as const;

export const LIFECYCLE_STAGES = [
  {
    id: "lead",
    title: "Lead",
    body: "Capture interest before it disappears into a spreadsheet.",
  },
  {
    id: "opportunity",
    title: "Opportunity",
    body: "Qualify deals and keep pipeline honest.",
  },
  {
    id: "bid",
    title: "Bid",
    body: "Staff the right work with transparent comparison.",
  },
  {
    id: "proposal",
    title: "Proposal",
    body: "Scope, timeline, and investment in one document.",
  },
  {
    id: "contract",
    title: "Contract",
    body: "Lock terms before delivery begins.",
  },
  {
    id: "project",
    title: "Project",
    body: "Tasks, milestones, and team in one thread.",
  },
  {
    id: "invoice",
    title: "Invoice",
    body: "Bill against real delivery progress.",
  },
  {
    id: "payment",
    title: "Payment",
    body: "Track what landed — and what is outstanding.",
  },
  {
    id: "profit",
    title: "Profit",
    body: "See margin after cost, time, and fees.",
  },
] as const;
