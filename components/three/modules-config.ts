export type UniverseZoneId =
  | "crm"
  | "sales"
  | "projects"
  | "bidding"
  | "resources"
  | "finance"
  | "clients"
  | "reports";

export type ZoneConfig = {
  id: UniverseZoneId;
  title: string;
  subtitle: string;
  /** Desktop orbital position around hub */
  position: [number, number, number];
  accent: string;
  sectionId: string;
};

/** Floating platforms around the TechNova Business Hub */
export const UNIVERSE_ZONES: ZoneConfig[] = [
  {
    id: "crm",
    title: "CRM",
    subtitle: "Relationships",
    position: [-2.6, 1.35, 0.2],
    accent: "#2dd4bf",
    sectionId: "crm",
  },
  {
    id: "sales",
    title: "Sales",
    subtitle: "Pipeline",
    position: [0, 2.05, -0.4],
    accent: "#38bdf8",
    sectionId: "sales",
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "Delivery",
    position: [2.6, 1.35, 0.2],
    accent: "#67e8f9",
    sectionId: "projects",
  },
  {
    id: "bidding",
    title: "Bidding",
    subtitle: "Staffing",
    position: [-2.85, -0.15, 0.85],
    accent: "#fbbf24",
    sectionId: "bidding",
  },
  {
    id: "resources",
    title: "Resources",
    subtitle: "People",
    position: [2.85, -0.15, 0.85],
    accent: "#a3e635",
    sectionId: "resources",
  },
  {
    id: "finance",
    title: "Finance",
    subtitle: "Money",
    position: [-1.5, -1.55, 0.35],
    accent: "#34d399",
    sectionId: "finance",
  },
  {
    id: "clients",
    title: "Clients",
    subtitle: "Portals",
    position: [1.5, -1.55, 0.35],
    accent: "#94a3b8",
    sectionId: "client-portal",
  },
  {
    id: "reports",
    title: "Reports",
    subtitle: "Insight",
    position: [0, -2.15, -0.1],
    accent: "#5eead4",
    sectionId: "dashboard",
  },
];

export const CAMERA_STAGES: Record<
  string,
  { position: [number, number, number]; lookAt: [number, number, number] }
> = {
  hero: { position: [0, 1.1, 7.2], lookAt: [0, 0.15, 0] },
  problem: { position: [2.8, 1.4, 6.4], lookAt: [0.4, 0.2, 0] },
  solution: { position: [-1.8, 0.9, 5.8], lookAt: [0, 0.1, 0] },
  workflow: { position: [0, 0.6, 6.8], lookAt: [0, 0, 0] },
  crm: { position: [-2.2, 1.55, 4.2], lookAt: [-2.4, 1.25, 0] },
  sales: { position: [0.15, 2.2, 4.4], lookAt: [0, 1.9, -0.2] },
  proposals: { position: [0.4, 1.7, 4.8], lookAt: [0.2, 1.4, 0] },
  projects: { position: [2.2, 1.55, 4.2], lookAt: [2.4, 1.25, 0] },
  bidding: { position: [-2.4, 0.2, 4.6], lookAt: [-2.6, -0.1, 0.5] },
  resources: { position: [2.4, 0.2, 4.6], lookAt: [2.6, -0.1, 0.5] },
  time: { position: [1.6, -0.4, 5.0], lookAt: [1.2, -0.8, 0.2] },
  finance: { position: [-1.3, -1.1, 4.5], lookAt: [-1.4, -1.4, 0.2] },
  profit: { position: [0, -1.0, 5.2], lookAt: [0, -1.4, 0] },
  "client-portal": { position: [1.4, -1.2, 4.6], lookAt: [1.4, -1.45, 0.2] },
  "freelancer-portal": {
    position: [-0.8, -1.3, 4.8],
    lookAt: [0.2, -1.5, 0.1],
  },
  roles: { position: [0, 0.5, 6.0], lookAt: [0, 0.1, 0] },
  dashboard: { position: [0, -1.6, 4.8], lookAt: [0, -2.0, 0] },
  beforeafter: { position: [1.2, 0.8, 6.2], lookAt: [0, 0.1, 0] },
  usecases: { position: [-1.0, 0.6, 6.0], lookAt: [0, 0.05, 0] },
  faq: { position: [0.5, 0.4, 6.4], lookAt: [0, 0, 0] },
  cta: { position: [0, 0.55, 5.4], lookAt: [0, 0.1, 0] },
};

/** @deprecated use UNIVERSE_ZONES — kept for any leftover imports */
export const MARKETING_MODULES = UNIVERSE_ZONES.map((z) => ({
  id: z.id,
  title: z.title,
  subtitle: z.subtitle,
  position: z.position,
  mobileY: z.position[1],
  accent: z.accent,
  sectionId: z.sectionId,
}));

export type MarketingModuleId = UniverseZoneId;
export type ModuleConfig = (typeof MARKETING_MODULES)[number];

export const DEMO_COPY = {
  disclaimer:
    "UI previews are illustrative product samples — not live customer data.",
} as const;
