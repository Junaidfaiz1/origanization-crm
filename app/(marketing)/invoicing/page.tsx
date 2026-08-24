import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Invoicing",
  description:
    "Create and track invoices per organization with amounts tied to the projects you deliver in TechNova.",
  path: MARKETING_ROUTES.invoicing,
});

function InvoiceVisual() {
  return (
    <div className="relative min-h-[16rem] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/35 via-slate-950 to-slate-950 p-6">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] shadow-[0_20px_60px_rgb(0_0_0_/_0.4)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">Invoice</span>
          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
            Draft
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Client · Project</span>
            <span className="text-slate-300">Linked</span>
          </div>
          <div className="h-px bg-white/[0.06]" />
          {["Line item A", "Line item B"].map((line) => (
            <div key={line} className="flex justify-between text-xs">
              <span className="text-slate-400">{line}</span>
              <span className="h-2 w-12 rounded bg-white/10" />
            </div>
          ))}
          <div className="flex justify-between border-t border-white/[0.06] pt-3 text-sm font-semibold text-white">
            <span>Total</span>
            <span className="h-3 w-16 rounded bg-emerald-400/30" />
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-600">
        Unique invoice numbers per organization
      </p>
    </div>
  );
}

export default function InvoicingPage() {
  return (
    <ProductLandingPage
      eyebrow="Invoicing"
      title={
        <>
          Bill the work
          <span className="mt-2 block text-slate-300">you actually delivered.</span>
        </>
      }
      lead="Invoices live next to clients and projects. Numbers are unique per organization, and paid amounts stay honest against the total."
      metaphor="Document → balance"
      secondaryCta={{ href: MARKETING_ROUTES.payments, label: "Payments" }}
      problem={{
        title: "Billing floats away from delivery",
        body: "When invoices live in accounting-only tools, project managers cannot see what was billed against the work.",
      }}
      solution={{
        title: "Invoices in the operating system",
        body: "TechNova keeps invoicing in the same workspace as projects and clients — with server rules for amounts and tenancy.",
      }}
      workflow={["Project", "Invoice", "Send", "Payment", "Balance"]}
      features={[
        {
          title: "Org-unique numbers",
          body: "Invoice numbers are unique per organization to avoid cross-tenant collisions.",
        },
        {
          title: "Amount integrity",
          body: "Amount paid cannot exceed total unless explicit credit/refund logic exists.",
        },
        {
          title: "Permissioned finance",
          body: "Invoice views and mutations respect finance permissions on the server.",
        },
        {
          title: "Client visibility",
          body: "Clients can see their invoices in the portal — not internal cost or margin.",
        },
      ]}
      uiTitle="technova · invoices"
      uiItems={["Invoice list", "Invoice detail", "Line items", "Payment status"]}
      faq={[
        {
          q: "Does creating an invoice mark it paid?",
          a: "No. Payment success comes from the payment flow / webhook — not from the browser alone.",
        },
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.payments, label: "Payments" },
        { href: MARKETING_ROUTES.profitability, label: "Profitability" },
        { href: MARKETING_ROUTES.clientPortal, label: "Client portal" },
      ]}
      visual={<InvoiceVisual />}
    />
  );
}
