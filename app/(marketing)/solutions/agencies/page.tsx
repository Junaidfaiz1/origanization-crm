import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Agencies",
  description: "From lead to retained client — Technova for digital and creative agencies.",
  path: MARKETING_ROUTES.agencies,
});

export default function AgenciesPage() {
  return (
    <ProductLandingPage
      eyebrow="Agencies"
      title={
        <>
          From lead
          <span className="mt-2 block text-[var(--mk-text-2)]">
            to retained client.
          </span>
        </>
      }
      lead="Pipeline, proposals, freelancers, delivery, and profitability for agencies that live on client work."
      metaphor="Agency delivery board"
      problem={{
        title: "Retainers deserve one system",
        body: "Creative and account teams bounce between CRM, project tools, and finance sheets.",
      }}
      solution={{
        title: "Client work in one rhythm",
        body: "Win the work, staff it, deliver it, invoice it — without losing margin visibility.",
      }}
      workflow={["Lead", "Pitch", "Staff", "Deliver", "Invoice", "Retain"]}
      features={[
        { title: "Client CRM", body: "Account history beside active projects." },
        { title: "Bidding & freelancers", body: "Staff overflow without leaking rates." },
        { title: "Delivery", body: "Tasks and milestones clients can follow in portal." },
        { title: "Profitability", body: "Know which retainers actually pay." },
      ]}
      uiTitle="Agency workspace"
      uiItems={[
        "Pipeline",
        "Proposals",
        "Freelancer bids",
        "Projects",
        "Client portal",
        "Invoices",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.softwareHouses, label: "Software houses →" },
        { href: MARKETING_ROUTES.bidding, label: "Bidding →" },
        { href: MARKETING_ROUTES.contact, label: "Contact →" },
      ]}
    />
  );
}
