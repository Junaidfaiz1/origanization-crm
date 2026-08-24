import Link from "next/link";
import { MarketingShell } from "@/components/marketing/shell";
import {
  MagneticButton,
  SectionEyebrow,
} from "@/components/marketing/primitives";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES, PRODUCT_NAV } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Features",
  description:
    "Everything your business needs — CRM, bidding, proposals, projects, finance, analytics, and more in Technova CRM.",
  path: MARKETING_ROUTES.features,
});

const CATEGORIES = [
  {
    title: "CRM",
    body: "Clients, contacts, companies, pipeline, and relationship history.",
    href: MARKETING_ROUTES.crm,
  },
  {
    title: "Bidding",
    body: "Score opportunities, compare bids, and award with confidence.",
    href: MARKETING_ROUTES.bidding,
  },
  {
    title: "Proposals",
    body: "Scope, timeline, and investment in a structured document.",
    href: MARKETING_ROUTES.crm,
  },
  {
    title: "Projects",
    body: "Tasks, milestones, team, and delivery progress.",
    href: MARKETING_ROUTES.projectManagement,
  },
  {
    title: "Tasks",
    body: "Kanban and lists that stay connected to the project.",
    href: MARKETING_ROUTES.projectManagement,
  },
  {
    title: "Contracts",
    body: "Terms that lock before delivery begins.",
    href: MARKETING_ROUTES.finance,
  },
  {
    title: "Invoices",
    body: "Bill against real delivery and track outstanding.",
    href: MARKETING_ROUTES.invoicing,
  },
  {
    title: "Payments",
    body: "Record what landed — webhook-ready architecture.",
    href: MARKETING_ROUTES.payments,
  },
  {
    title: "Finance",
    body: "Revenue, expenses, and project-level cost.",
    href: MARKETING_ROUTES.finance,
  },
  {
    title: "Analytics",
    body: "Pipeline, win rate, margin, and utilization views.",
    href: MARKETING_ROUTES.analytics,
  },
  {
    title: "Team",
    body: "Workload, assignments, and portals for collaborators.",
    href: MARKETING_ROUTES.resourceManagement,
  },
  {
    title: "Automation",
    body: "Illustrative win-to-invoice workflow patterns.",
    href: MARKETING_ROUTES.features,
  },
] as const;

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 mk-editorial-grid opacity-30" />
        <div className="relative mx-auto max-w-6xl">
          <SectionEyebrow>Features</SectionEyebrow>
          <h1 className="mk-display mt-4 max-w-3xl text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Everything your business needs.
            <span className="mt-2 block text-[var(--mk-text-2)]">
              Nothing you don&apos;t.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--mk-text-2)] sm:text-lg">
            A complete operating surface for service businesses — from first lead
            to measured profit.
          </p>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.title}
              href={c.href}
              className={`group rounded-xl border border-white/10 bg-[#101010] p-6 transition-colors hover:border-[var(--mk-bronze)]/40 ${
                i === 0 || i === 1 ? "lg:min-h-[14rem]" : ""
              }`}
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--mk-muted)]">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="mt-3 text-xl font-medium text-[var(--mk-text)] group-hover:text-[var(--mk-warm)]">
                {c.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--mk-text-2)]">
                {c.body}
              </p>
            </Link>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-6xl rounded-xl border border-white/10 bg-[#0a0a0a] p-8">
          <SectionEyebrow>Product destinations</SectionEyebrow>
          <div className="mt-6 flex flex-wrap gap-3">
            {PRODUCT_NAV.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--mk-text-2)] hover:border-[var(--mk-bronze)]/40"
              >
                {p.title}
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <MagneticButton href="/register">Get started</MagneticButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
