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
  title: "Finance",
  description:
    "Know where every dollar goes — invoices, payments, expenses, revenue, and margin in Technova CRM.",
  path: MARKETING_ROUTES.finance,
});

function FinanceVisual() {
  return (
    <ProductWindow activeNav="Finance">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricTile label="Revenue" value={formatDemoMoney(d.revenue)} />
        <MetricTile label="Profit" value={formatDemoMoney(d.grossProfit)} />
        <MetricTile label="Margin" value={formatDemoPercent(d.profitMargin)} />
      </div>
      <div className="mt-4">
        <SparkBars values={d.revenueSeries} />
      </div>
    </ProductWindow>
  );
}

export default function FinancePage() {
  return (
    <ProductLandingPage
      eyebrow="Finance"
      title={
        <>
          Know where
          <span className="mt-2 block text-[var(--mk-text-2)]">
            every dollar goes.
          </span>
        </>
      }
      lead="Invoices, payments, expenses, revenue, profit, margins, and outstanding balances — with demo figures for marketing previews."
      metaphor="Floating financial numbers"
      secondaryCta={{
        href: MARKETING_ROUTES.profitability,
        label: "Profitability",
      }}
      problem={{
        title: "Money is scattered",
        body: "Invoices in one tool, expenses in another, and margin calculated once a month in a spreadsheet.",
      }}
      solution={{
        title: "Finance beside delivery",
        body: "See cost, revenue, and outstanding next to the projects that created them.",
      }}
      workflow={["Invoice", "Send", "Payment", "Expense", "Margin"]}
      features={[
        { title: "Invoices", body: "Numbered per organization with clear status." },
        { title: "Payments", body: "Track what landed and what is outstanding." },
        { title: "Expenses", body: "Project-aware cost capture." },
        { title: "Revenue views", body: "Static demo charts for product storytelling." },
        { title: "Margins", body: "Profit after resource cost, expenses, and fees." },
        { title: "Reports", body: "Finance screens gated by permissions in-app." },
      ]}
      uiTitle="Finance surface"
      uiItems={[
        "Invoices",
        "Payments",
        "Expenses",
        "Revenue",
        "Profit",
        "Margins",
        "Outstanding payments",
        "Financial reports",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.analytics, label: "Analytics →" },
        { href: MARKETING_ROUTES.invoicing, label: "Invoicing →" },
        { href: MARKETING_ROUTES.contact, label: "Contact →" },
      ]}
      visual={<FinanceVisual />}
    />
  );
}
