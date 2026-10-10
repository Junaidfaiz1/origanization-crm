import { ProductLandingPage } from "@/components/marketing/product-landing";
import {
  formatDemoMoney,
  marketingDemoData as d,
} from "@/lib/marketing/demo-data";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";
import { DemoBadge } from "@/components/marketing/primitives";

export const metadata = marketingMetadata({
  title: "Profitability",
  description:
    "See project margin after revenue, cost, expenses, and fees — Technova profitability views.",
  path: MARKETING_ROUTES.profitability,
});

function ProfitVisual() {
  return (
    <div className="rounded-xl border border-[var(--mk-line)] bg-[var(--mk-surface)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium">Project margins</p>
        <DemoBadge />
      </div>
      <ul className="space-y-4">
        {d.profitability.map((p) => (
          <li key={p.name}>
            <div className="flex justify-between text-xs">
              <span>{p.name}</span>
              <span className="text-[var(--mk-bronze)]">{p.margin}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--mk-tint)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--mk-bronze)] to-[var(--mk-blue)]"
                style={{ width: `${p.margin}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-[var(--mk-muted)]">
              {formatDemoMoney(p.revenue)} · {formatDemoMoney(p.profit)} profit
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProfitabilityPage() {
  return (
    <ProductLandingPage
      eyebrow="Profitability"
      title={
        <>
          Margin is the truth{" "}
          <span className="mt-2 block text-[var(--mk-text-2)]">
            behind the revenue.
          </span>
        </>
      }
      lead="Revenue minus resource cost, expenses, and fees — visualized per project with static demo figures on marketing pages."
      metaphor="Margin rings"
      secondaryCta={{ href: MARKETING_ROUTES.finance, label: "Finance" }}
      problem={{
        title: "Revenue hides cost",
        body: "Teams celebrate bookings while delivery quietly erodes margin.",
      }}
      solution={{
        title: "Profit beside the project",
        body: "See which engagements actually contribute after real cost.",
      }}
      workflow={["Revenue", "Cost", "Expenses", "Fees", "Profit", "Margin"]}
      features={[
        { title: "Project P&L", body: "Per-engagement economics." },
        { title: "Cost inputs", body: "Time, resources, and expenses." },
        { title: "Margin bars", body: "Visual comparison across work." },
        { title: "Honest zeros", body: "No NaN when revenue is empty." },
      ]}
      uiTitle="Profitability surface"
      uiItems={["Project A/B/C demos", "Margin bars", "Cost breakdown", "Fees"]}
      nextLinks={[
        { href: MARKETING_ROUTES.finance, label: "Finance →" },
        { href: MARKETING_ROUTES.analytics, label: "Analytics →" },
        { href: MARKETING_ROUTES.contact, label: "Contact →" },
      ]}
      visual={<ProfitVisual />}
    />
  );
}
