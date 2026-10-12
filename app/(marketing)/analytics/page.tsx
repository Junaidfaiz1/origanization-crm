import { ProductLandingPage } from "@/components/marketing/product-landing";
import {
  formatDemoMoney,
  formatDemoPercent,
  marketingDemoData as d,
} from "@/lib/marketing/demo-data";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";
import {
  MetricTile,
  ProductWindow,
  SparkBars,
} from "@/components/marketing/product-window";

export const metadata = marketingMetadata({
  title: "Analytics",
  description:
    "See the business behind the busy — revenue, pipeline, conversion, and profitability analytics in Technova.",
  path: MARKETING_ROUTES.analytics,
});

function AnalyticsVisual() {
  return (
    <ProductWindow activeNav="Analytics">
      <div className="grid grid-cols-2 gap-2">
        <MetricTile label="Revenue" value={formatDemoMoney(d.revenue)} />
        <MetricTile label="Pipeline" value={formatDemoMoney(d.pipeline)} />
        <MetricTile label="Win rate" value={formatDemoPercent(d.winRate)} />
        <MetricTile label="Utilization" value={`${d.teamUtilization}%`} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SparkBars values={d.revenueSeries} />
        <SparkBars values={d.pipelineSeries} color="var(--mk-blue)" />
      </div>
    </ProductWindow>
  );
}

export default function AnalyticsPage() {
  return (
    <ProductLandingPage
      eyebrow="Analytics"
      title={
        <>
          See the business{" "}
          <span className="mt-2 block text-[var(--mk-text-2)]">
            behind the busy.
          </span>
        </>
      }
      lead="Revenue trends, pipeline, conversion, project profitability, client lifetime value, and team performance — shown here with static demo data."
      metaphor="Chart visualization"
      secondaryCta={{ href: MARKETING_ROUTES.finance, label: "Finance" }}
      problem={{
        title: "Activity without signal",
        body: "Busy teams still miss margin leaks, stalled pipeline, and uneven utilization.",
      }}
      solution={{
        title: "One analytical surface",
        body: "Connect sales, delivery, and finance into views leadership can trust.",
      }}
      workflow={["Capture", "Aggregate", "Visualize", "Decide"]}
      features={[
        { title: "Revenue trends", body: "Month-over-month storytelling charts." },
        { title: "Pipeline health", body: "Volume and stage distribution." },
        { title: "Conversion", body: "Win rate and average deal size." },
        { title: "Profitability", body: "Project margin beside delivery cost." },
        { title: "Client value", body: "Lifetime value signals for key accounts." },
        { title: "Team performance", body: "Utilization and workload clarity." },
      ]}
      uiTitle="Analytics surface"
      uiItems={[
        "Revenue trends",
        "Pipeline",
        "Conversion",
        "Project profitability",
        "Client lifetime value",
        "Team performance",
        "Sales performance",
        "Forecast",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.finance, label: "Finance →" },
        { href: MARKETING_ROUTES.crm, label: "CRM →" },
        { href: MARKETING_ROUTES.features, label: "Features →" },
      ]}
      visual={<AnalyticsVisual />}
    />
  );
}
