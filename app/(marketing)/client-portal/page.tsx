import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Client portal",
  description:
    "Give clients progress, milestones, deliverables, and invoices — without bidding internals, rates, or agency profit.",
  path: MARKETING_ROUTES.clientPortal,
});

function ClientBoundaryVisual() {
  return (
    <div className="relative grid min-h-[16rem] gap-3 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950 to-teal-950/30 p-5 sm:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 opacity-70">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Internal
        </p>
        <ul className="mt-4 space-y-2 text-[11px] text-slate-500">
          {["Bidding", "Freelancer rates", "Margin", "Internal notes"].map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-rose-400/70" />
              {i}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-teal-500/35 bg-teal-500/10 p-4 shadow-[0_0_40px_rgb(13_148_136_/_0.15)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">
          Client portal
        </p>
        <ul className="mt-4 space-y-2 text-[11px] text-slate-200">
          {["Progress", "Milestones", "Deliverables", "Invoices", "Payments"].map((i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-teal-300" />
              {i}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  return (
    <ProductLandingPage
      eyebrow="Client portal"
      title={
        <>
          A better client experience
          <span className="mt-2 block text-slate-300">with a hard boundary.</span>
        </>
      }
      lead="Clients see progress, milestones, deliverables, invoices, and payments. They do not see bidding, freelancer costs, agency profit, or internal notes."
      metaphor="Internal vs client boundary"
      secondaryCta={{ href: MARKETING_ROUTES.security, label: "Security" }}
      problem={{
        title: "Shared logins leak the wrong things",
        body: "Inviting clients into the internal workspace exposes staffing costs and messy internal chatter.",
      }}
      solution={{
        title: "A dedicated client surface",
        body: "TechNova’s client portal is a separate, permissioned experience that strips internal fields on the server — not just in the UI.",
      }}
      workflow={["Invite client", "Share progress", "Deliverables", "Invoice", "Payment"]}
      features={[
        {
          title: "Progress without panic",
          body: "Show milestones and delivery status without exposing how you staffed the work.",
        },
        {
          title: "Billing clarity",
          body: "Clients can view invoices and payment status in one place.",
        },
        {
          title: "No bidding internals",
          body: "Competing rates, negotiations, and freelancer costs stay internal.",
        },
        {
          title: "No profit leakage",
          body: "Agency margin and internal notes are not part of the client field set.",
        },
      ]}
      uiTitle="technova · client portal"
      uiItems={["Projects", "Milestones", "Deliverables", "Invoices", "Payments"]}
      faq={[
        {
          q: "Is the portal just a filtered dashboard?",
          a: "It is a role-gated portal experience. Sensitive fields are stripped for clients — UI hiding alone is not the control.",
        },
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.freelancerPortal, label: "Freelancer portal" },
        { href: MARKETING_ROUTES.invoicing, label: "Invoicing" },
        { href: MARKETING_ROUTES.projectManagement, label: "Projects" },
      ]}
      visual={<ClientBoundaryVisual />}
    />
  );
}
