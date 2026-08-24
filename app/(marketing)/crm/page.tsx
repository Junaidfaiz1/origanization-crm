import { ProductLandingPage } from "@/components/marketing/product-landing";
import {
  formatDemoMoney,
  marketingDemoData as d,
} from "@/lib/marketing/demo-data";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";
import {
  MetricTile,
  ProductWindow,
} from "@/components/marketing/product-window";
import { DemoBadge } from "@/components/marketing/primitives";

export const metadata = marketingMetadata({
  title: "CRM",
  description:
    "Know every client before the next meeting — contacts, pipeline, activities, and health in Technova CRM.",
  path: MARKETING_ROUTES.crm,
});

function CrmVisual() {
  return (
    <ProductWindow activeNav="Clients">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-medium">{d.client.name}</p>
          <p className="text-xs text-[var(--mk-muted)]">
            {d.client.industry} · {d.client.status}
          </p>
        </div>
        <DemoBadge>Sample</DemoBadge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile label="LTV" value={formatDemoMoney(d.client.ltv)} />
        <MetricTile label="Projects" value={String(d.client.projects)} />
        <MetricTile label="Health" value={d.client.health} />
      </div>
    </ProductWindow>
  );
}

export default function CrmPage() {
  return (
    <ProductLandingPage
      eyebrow="CRM"
      title={
        <>
          Know every client
          <span className="mt-2 block text-[var(--mk-text-2)]">
            before the next meeting.
          </span>
        </>
      }
      lead="Contacts, companies, leads, pipeline, activities, notes, and client health — one relationship system."
      metaphor="Floating client graph"
      secondaryCta={{ href: MARKETING_ROUTES.features, label: "All features" }}
      problem={{
        title: "Context dies between tools",
        body: "When leads live in one place and projects in another, the team re-enters the same story. Handoffs get lossy.",
      }}
      solution={{
        title: "One connected record",
        body: "Sales context survives into delivery. Notes, history, and health stay attached to the client.",
      }}
      workflow={[
        "Lead",
        "Qualify",
        "Opportunity",
        "Proposal",
        "Client",
        "History",
      ]}
      features={[
        {
          title: "Contacts & companies",
          body: "People and accounts with clear ownership.",
        },
        {
          title: "Pipeline",
          body: "Stages that match how your team actually sells.",
        },
        {
          title: "Activities & notes",
          body: "What happened — and what happens next.",
        },
        {
          title: "Client health",
          body: "A pulse on relationship strength and delivery risk.",
        },
        {
          title: "Projects & invoices",
          body: "Commercial history beside the relationship.",
        },
        {
          title: "Communication trail",
          body: "Keep the story in the workspace, not twelve inboxes.",
        },
      ]}
      uiTitle="CRM surface"
      uiItems={[
        "Contacts",
        "Companies",
        "Leads",
        "Pipeline",
        "Activities",
        "Notes",
        "Client history",
        "Client health",
        "Tasks",
        "Communication",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.bidding, label: "Bidding →" },
        { href: MARKETING_ROUTES.projectManagement, label: "Projects →" },
        { href: MARKETING_ROUTES.finance, label: "Finance →" },
      ]}
      visual={<CrmVisual />}
    />
  );
}
