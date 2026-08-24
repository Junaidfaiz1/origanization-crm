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

export const metadata = marketingMetadata({
  title: "Project management",
  description:
    "Once you win the work, deliver it beautifully — projects, tasks, kanban, milestones, and budget in Technova.",
  path: MARKETING_ROUTES.projectManagement,
});

function ProjectVisual() {
  return (
    <ProductWindow activeNav="Projects">
      <p className="text-sm font-medium">{d.project.name}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricTile label="Progress" value={`${d.project.progress}%`} />
        <MetricTile
          label="Tasks"
          value={`${d.project.tasksDone}/${d.project.tasksTotal}`}
        />
        <MetricTile
          label="Budget"
          value={formatDemoMoney(d.project.budgetUsed)}
        />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-[var(--mk-bronze)]"
          style={{ width: `${d.project.progress}%` }}
        />
      </div>
    </ProductWindow>
  );
}

export default function ProjectManagementPage() {
  return (
    <ProductLandingPage
      eyebrow="Projects"
      title={
        <>
          Once you win the work,
          <span className="mt-2 block text-[var(--mk-text-2)]">
            deliver it beautifully.
          </span>
        </>
      }
      lead="Projects, tasks, kanban, timeline, milestones, resources, time, budget, and profitability in one delivery system."
      metaphor="3D timeline"
      secondaryCta={{ href: MARKETING_ROUTES.finance, label: "Finance" }}
      problem={{
        title: "Delivery drifts from the sale",
        body: "Scope won in a proposal becomes a disconnected board somewhere else.",
      }}
      solution={{
        title: "Delivery inherits context",
        body: "Team, milestones, and budget stay attached to the commercial story.",
      }}
      workflow={["Plan", "Assign", "Execute", "Review", "Ship", "Learn"]}
      features={[
        { title: "Overview", body: "Progress, budget, and deadline at a glance." },
        { title: "Kanban & lists", body: "Tasks that stay project-scoped." },
        { title: "Milestones", body: "Client-visible checkpoints." },
        { title: "Team", body: "Who owns what — and how loaded they are." },
        { title: "Time & budget", body: "Effort against commercial caps." },
        { title: "Profitability", body: "Margin after cost lands." },
      ]}
      uiTitle="Project surface"
      uiItems={[
        "Projects",
        "Tasks",
        "Kanban",
        "Timeline",
        "Milestones",
        "Resources",
        "Time",
        "Budget",
        "Profitability",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.crm, label: "CRM →" },
        { href: MARKETING_ROUTES.bidding, label: "Bidding →" },
        { href: MARKETING_ROUTES.analytics, label: "Analytics →" },
      ]}
      visual={<ProjectVisual />}
    />
  );
}
