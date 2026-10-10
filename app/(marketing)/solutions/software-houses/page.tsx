import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Software houses",
  description:
    "Sell projects. Deliver them. Protect the margin — Technova for software houses.",
  path: MARKETING_ROUTES.softwareHouses,
});

export default function SoftwareHousesPage() {
  return (
    <ProductLandingPage
      eyebrow="Software houses"
      title={
        <>
          Sell projects.{" "}
          <span className="mt-2 block text-[var(--mk-text-2)]">
            Deliver them. Protect the margin.
          </span>
        </>
      }
      lead="From opportunity to shipped release with time, cost, and invoice visibility on every engagement."
      metaphor="Build pipeline"
      problem={{
        title: "Delivery outruns commercial truth",
        body: "Engineering moves fast while finance learns margin weeks later.",
      }}
      solution={{
        title: "Commercial delivery loop",
        body: "Projects inherit scope from proposals; time and expenses feed profitability.",
      }}
      workflow={["Opportunity", "Proposal", "Build", "Time", "Invoice", "Margin"]}
      features={[
        { title: "Sales → project", body: "Won work becomes a delivery workspace." },
        { title: "Time & cost", body: "Effort maps to project economics." },
        { title: "Resources", body: "Assign the right people at clear rates." },
        { title: "Client portal", body: "Share progress without internal noise." },
      ]}
      uiTitle="Software house surface"
      uiItems={[
        "Opportunities",
        "Proposals",
        "Projects",
        "Time tracking",
        "Invoices",
        "Profitability",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.consultants, label: "Consultants →" },
        { href: MARKETING_ROUTES.projectManagement, label: "Projects →" },
        { href: MARKETING_ROUTES.finance, label: "Finance →" },
      ]}
    />
  );
}
