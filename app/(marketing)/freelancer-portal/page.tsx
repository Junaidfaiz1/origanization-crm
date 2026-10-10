import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Freelancer portal",
  description:
    "Freelancers get requests, their bids, assigned work, tasks, and time — not competing private bids or agency margin.",
  path: MARKETING_ROUTES.freelancerPortal,
});

function FreelancerVisual() {
  return (
    <div className="relative min-h-[16rem] overflow-hidden rounded-3xl border border-[var(--mk-line)] bg-gradient-to-br from-orange-950/30 via-slate-950 to-slate-950 p-5">
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          "Available requests",
          "My bids",
          "Assigned projects",
          "Tasks",
          "Time",
          "Profile",
        ].map((item, i) => (
          <div
            key={item}
            className={`rounded-xl border px-3 py-3 text-xs font-medium ${
              i < 2
                ? "border-orange-400/30 bg-orange-500/10 text-orange-50"
                : "border-[var(--mk-line)] bg-[var(--mk-tint)] text-slate-300"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] text-slate-500">
        Private bids stay private · margin stays internal
      </p>
    </div>
  );
}

export default function FreelancerPortalPage() {
  return (
    <ProductLandingPage
      eyebrow="Freelancer portal"
      title={
        <>
          Exactly what collaborators need{" "}
          <span className="mt-2 block text-slate-300">— nothing they shouldn’t see.</span>
        </>
      }
      lead="Freelancers work from a dedicated portal: eligible requests, their own bids, assigned projects, tasks, and time. Competing private bids and agency margin stay out of reach."
      metaphor="Collaborator workbench"
      secondaryCta={{ href: MARKETING_ROUTES.bidding, label: "Bidding" }}
      problem={{
        title: "Freelancers in the main app is messy",
        body: "Full workspace access either overwhelms collaborators or risks leaking commercial data.",
      }}
      solution={{
        title: "A focused freelancer surface",
        body: "TechNova’s freelancer portal is role-gated. Private bid isolation and margin hiding are enforced server-side.",
      }}
      workflow={["Request", "Bid", "Award", "Tasks", "Time"]}
      features={[
        {
          title: "Eligible requests",
          body: "See bid requests you can respond to — without browsing every internal commercial detail.",
        },
        {
          title: "My bids only",
          body: "Your amounts and status — not other freelancers’ private bids.",
        },
        {
          title: "Assigned delivery",
          body: "After award, work on assigned projects and tasks from the same portal.",
        },
        {
          title: "Time logging",
          body: "Capture effort against assigned work without seeing agency profit.",
        },
      ]}
      uiTitle="technova · freelancer"
      uiItems={["Requests", "My bids", "Projects", "Tasks", "Time", "Profile"]}
      faq={[
        {
          q: "Can freelancers see client invoices?",
          a: "The freelancer portal is about requests, bids, delivery, and time — not agency billing internals or margin.",
        },
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.bidding, label: "Bidding" },
        { href: MARKETING_ROUTES.clientPortal, label: "Client portal" },
        { href: MARKETING_ROUTES.timeTracking, label: "Time tracking" },
      ]}
      visual={<FreelancerVisual />}
    />
  );
}
