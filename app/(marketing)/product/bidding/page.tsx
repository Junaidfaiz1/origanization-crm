import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingDemoData as d } from "@/lib/marketing/demo-data";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";
import {
  MetricTile,
  ProductWindow,
} from "@/components/marketing/product-window";
import { DemoBadge } from "@/components/marketing/primitives";

export const metadata = marketingMetadata({
  title: "Bidding",
  description:
    "Stop chasing every opportunity. Score work, manage bids, and propose with confidence in Technova.",
  path: MARKETING_ROUTES.bidding,
});

function BidVisual() {
  return (
    <ProductWindow activeNav="Bidding">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{d.bid.project}</p>
        <DemoBadge>Sample</DemoBadge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricTile label="Platform" value={d.bid.platform} />
        <MetricTile label="Match" value={`${d.bid.matchScore}%`} />
        <MetricTile label="Budget" value={d.bid.budget} />
        <MetricTile label="Status" value={d.bid.status} />
      </div>
    </ProductWindow>
  );
}

export default function BiddingProductPage() {
  return (
    <ProductLandingPage
      eyebrow="Bidding"
      title={
        <>
          Stop chasing every opportunity.
          <span className="mt-2 block text-[var(--mk-text-2)]">
            Start choosing the right ones.
          </span>
        </>
      }
      lead="Opportunity discovery, scoring, bid management, proposal creation, follow-up, and win/loss clarity — with private bid boundaries enforced."
      metaphor="Proposal cards around match score"
      secondaryCta={{ href: MARKETING_ROUTES.crm, label: "Explore CRM" }}
      problem={{
        title: "Bidding is a spreadsheet sport",
        body: "Teams chase volume, lose context, and leak rates across freelancers and clients.",
      }}
      solution={{
        title: "A controlled bidding workspace",
        body: "Requests, bids, negotiation history, and a single award transaction — without exposing competing private amounts.",
      }}
      workflow={[
        "Opportunity",
        "Score",
        "Bid",
        "Propose",
        "Follow-up",
        "Win / loss",
      ]}
      features={[
        {
          title: "Opportunity scoring",
          body: "Static match-score UI for evaluating fit before you bid.",
        },
        {
          title: "Bid management",
          body: "One active path per bidder with clear status.",
        },
        {
          title: "Private amounts",
          body: "Freelancers never see competing private bids.",
        },
        {
          title: "Award transaction",
          body: "Exactly one winner — enforced on the server.",
        },
        {
          title: "Negotiation history",
          body: "Append history — never overwrite the original amount.",
        },
        {
          title: "Win/loss clarity",
          body: "Understand what closed — and what didn’t.",
        },
      ]}
      uiTitle="Bidding surface"
      uiItems={[
        "Opportunity discovery",
        "Opportunity scoring",
        "Bid management",
        "Proposal creation",
        "Follow-up",
        "Win/loss analytics",
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.projectManagement, label: "Projects →" },
        { href: MARKETING_ROUTES.finance, label: "Finance →" },
        { href: MARKETING_ROUTES.security, label: "Security →" },
      ]}
      visual={<BidVisual />}
    />
  );
}
