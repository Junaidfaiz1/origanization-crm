import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Payments",
  description:
    "Record and reconcile payments against invoices. Stripe webhooks are the source of truth in TechNova.",
  path: MARKETING_ROUTES.payments,
});

function PaymentsVisual() {
  return (
    <div className="relative flex min-h-[16rem] flex-col justify-center overflow-hidden rounded-3xl border border-[var(--mk-line)] bg-gradient-to-br from-emerald-950/30 via-slate-950 to-slate-950 p-6">
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-xl border border-[var(--mk-line)] bg-[var(--mk-tint)] p-4">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Invoice</p>
          <div className="mt-3 h-2 rounded bg-[var(--mk-tint)]" />
          <div className="mt-2 h-2 w-2/3 rounded bg-[var(--mk-tint)]" />
        </div>
        <span className="text-emerald-400" aria-hidden>
          →
        </span>
        <div className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-[11px] uppercase tracking-wider text-emerald-200/90">Payment</p>
          <p className="mt-3 text-xs font-semibold text-emerald-100">Webhook confirmed</p>
          <p className="mt-1 text-[11px] text-slate-500">Idempotent · provider id</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-[var(--mk-line)] px-3 py-2 text-center text-[11px] text-slate-500">
        Browser alone is never the source of truth
      </div>
    </div>
  );
}

export default function PaymentsProductPage() {
  return (
    <ProductLandingPage
      eyebrow="Payments"
      title={
        <>
          Money in{" "}
          <span className="mt-2 block text-slate-300">with a trustworthy trail.</span>
        </>
      }
      lead="Payments attach to invoices. When Stripe is involved, webhooks confirm success — duplicate events stay idempotent."
      metaphor="Invoice → confirmed payment"
      secondaryCta={{ href: MARKETING_ROUTES.invoicing, label: "Invoicing" }}
      problem={{
        title: "“Paid” clicked in the UI is not payment",
        body: "Client-side success screens lie. Finance needs provider confirmation and deduplicated events.",
      }}
      solution={{
        title: "Webhook-backed payment truth",
        body: "TechNova records payments against invoices. Stripe webhook handling is designed as the source of truth, with unique provider payment ids for idempotency.",
      }}
      workflow={["Invoice", "Checkout / record", "Webhook", "Reconcile", "Balance"]}
      features={[
        {
          title: "Invoice linkage",
          body: "Payments are tied to invoices so balances stay coherent.",
        },
        {
          title: "Idempotent webhooks",
          body: "Duplicate provider events should not double-apply payment.",
        },
        {
          title: "Portal visibility",
          body: "Clients can see payment status on their invoices without seeing internal margin.",
        },
        {
          title: "Fees in the model",
          body: "Where payment fees exist, they can factor into profitability math.",
        },
      ]}
      uiTitle="technova · payments"
      uiItems={["Payment list", "Invoice link", "Provider reference", "Status"]}
      faq={[
        {
          q: "Is the browser success page enough?",
          a: "No. Payment success comes from the Stripe webhook (or equivalent server confirmation), not the browser alone.",
        },
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.invoicing, label: "Invoicing" },
        { href: MARKETING_ROUTES.profitability, label: "Profitability" },
        { href: MARKETING_ROUTES.security, label: "Security" },
      ]}
      visual={<PaymentsVisual />}
    />
  );
}
