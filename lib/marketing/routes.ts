/**
 * Public marketing routes.
 * Paths that collide with authenticated app routes use `/product/*` or alternate names.
 * App owns: /bidding, /time-tracking, /payments, /resources, /projects, /portal, /freelancer
 */
export const MARKETING_ROUTES = {
  home: "/",
  features: "/features",
  solutions: "/solutions",
  agencies: "/solutions/agencies",
  softwareHouses: "/solutions/software-houses",
  consulting: "/solutions/consulting",
  consultants: "/solutions/consultants",
  freelancers: "/solutions/freelancers",
  serviceBusinesses: "/solutions/service-businesses",
  crm: "/crm",
  projectManagement: "/project-management",
  bidding: "/product/bidding",
  finance: "/finance",
  analytics: "/analytics",
  customers: "/customers",
  guides: "/guides",
  resourceManagement: "/resource-management",
  timeTracking: "/product/time-tracking",
  invoicing: "/invoicing",
  payments: "/product/payments",
  profitability: "/profitability",
  clientPortal: "/client-portal",
  freelancerPortal: "/freelancer-portal",
  about: "/about",
  contact: "/contact",
  security: "/security",
} as const;

export type MarketingRouteKey = keyof typeof MARKETING_ROUTES;

export const PRODUCT_NAV = [
  {
    href: MARKETING_ROUTES.crm,
    title: "CRM",
    description: "Clients, pipeline, and relationship history",
  },
  {
    href: MARKETING_ROUTES.bidding,
    title: "Bidding",
    description: "Score opportunities and bid with confidence",
  },
  {
    href: MARKETING_ROUTES.projectManagement,
    title: "Projects",
    description: "Delivery, tasks, milestones, and team",
  },
  {
    href: MARKETING_ROUTES.finance,
    title: "Finance",
    description: "Invoices, payments, expenses, and margin",
  },
  {
    href: MARKETING_ROUTES.analytics,
    title: "Analytics",
    description: "Revenue, pipeline, and performance views",
  },
  {
    href: MARKETING_ROUTES.clientPortal,
    title: "Client portal",
    description: "Progress, files, and invoices for your clients",
  },
] as const;

export const SOLUTION_NAV = [
  {
    href: MARKETING_ROUTES.agencies,
    title: "Agencies",
    description: "From lead to retained client",
  },
  {
    href: MARKETING_ROUTES.softwareHouses,
    title: "Software houses",
    description: "Sell projects. Deliver. Protect margin.",
  },
  {
    href: MARKETING_ROUTES.consultants,
    title: "Consultants",
    description: "Turn expertise into predictable revenue",
  },
  {
    href: MARKETING_ROUTES.freelancers,
    title: "Freelancers",
    description: "Run your practice like a company",
  },
] as const;

export const COMPANY_NAV = [
  { href: MARKETING_ROUTES.about, title: "About", description: "Mission and product philosophy" },
  { href: MARKETING_ROUTES.customers, title: "Customers", description: "Demo case studies" },
  { href: MARKETING_ROUTES.contact, title: "Contact", description: "Talk with the Technova team" },
] as const;

export const RESOURCE_NAV = [
  { href: MARKETING_ROUTES.guides, title: "Guides", description: "Static articles and playbooks" },
  { href: MARKETING_ROUTES.features, title: "Features", description: "Full product map" },
  { href: MARKETING_ROUTES.security, title: "Security", description: "Tenancy, roles, and boundaries" },
] as const;
