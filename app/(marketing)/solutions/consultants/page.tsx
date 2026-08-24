import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Consultants",
  description:
    "Turn expertise into predictable revenue — Technova for consulting teams.",
  path: MARKETING_ROUTES.consultants,
});

export default function ConsultantsPage() {
  return (
    <ProductLandingPage
      eyebrow="Consultants"
      title={
        <>
          Turn expertise
          <span className="mt-2 block text-[var(--mk-text-2)]">
            into predictable revenue.
          </span>
        </>
      }
      lead="Opportunities, proposals, engagements, and billing for advisory and consulting practices."
      metaphor="Engagement timeline"
      problem={{
        title: "Expertise trapped in email",
        body: "Scopes live in decks, hours in sheets, and invoices in another login.",
      }}
      solution={{
        title: "Engagement operating system",
        body: "Pipeline through delivery with clear commercial boundaries.",
      }}
      workflow={["Lead", "Discovery", "Proposal", "Engage", "Bill", "Renew"]}
      features={[
        { title: "Pipeline discipline", body: "Fewer stages, clearer ownership." },
        { title: "Proposal structure", body: "Scope and investment stay aligned." },
        { title: "Engagement delivery", body: "Milestones clients can follow." },
        { title: "Clean billing", body: "Invoice against real progress." },
      ]}
      uiTitle="Consulting surface"
      uiItems={[
        "Opportunities",
        "Proposals",
        "Contracts",
        "Projects",
        "Time",
        "Invoices",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.freelancers, label: "Freelancers →" },
        { href: MARKETING_ROUTES.crm, label: "CRM →" },
        { href: MARKETING_ROUTES.contact, label: "Contact →" },
      ]}
    />
  );
}
