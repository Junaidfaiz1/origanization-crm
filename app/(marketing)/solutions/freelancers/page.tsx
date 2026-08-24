import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Freelancers",
  description:
    "Run your freelance business like a company — Technova for independent operators.",
  path: MARKETING_ROUTES.freelancers,
});

export default function FreelancersPage() {
  return (
    <ProductLandingPage
      eyebrow="Freelancers"
      title={
        <>
          Run your freelance business
          <span className="mt-2 block text-[var(--mk-text-2)]">
            like a company.
          </span>
        </>
      }
      lead="Bids, clients, projects, time, and invoices — without pretending you need a fifty-person org chart."
      metaphor="Solo operator desk"
      problem={{
        title: "Tools sized for enterprises",
        body: "Most freelancers stitch together five apps and still lose track of unpaid work.",
      }}
      solution={{
        title: "A serious solo workspace",
        body: "Bid, deliver, and get paid with the same lifecycle larger teams use.",
      }}
      workflow={["Opportunity", "Bid", "Win", "Deliver", "Invoice", "Paid"]}
      features={[
        { title: "Freelancer portal", body: "Requests, bids, and assigned work." },
        { title: "Time", body: "Log effort against real projects." },
        { title: "Invoices", body: "Bill cleanly when milestones land." },
        { title: "Boundaries", body: "Never see agency margin you shouldn’t." },
      ]}
      uiTitle="Freelancer surface"
      uiItems={[
        "Open requests",
        "My bids",
        "Assigned tasks",
        "Time entries",
        "Invoices",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.freelancerPortal, label: "Freelancer portal →" },
        { href: MARKETING_ROUTES.bidding, label: "Bidding →" },
        { href: MARKETING_ROUTES.contact, label: "Contact →" },
      ]}
    />
  );
}
