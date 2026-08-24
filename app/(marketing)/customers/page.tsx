import { MarketingShell } from "@/components/marketing/shell";
import {
  DemoBadge,
  MagneticButton,
  SectionEyebrow,
  SectionHeading,
} from "@/components/marketing/primitives";
import { marketingDemoData as d } from "@/lib/marketing/demo-data";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Customers",
  description:
    "Demo case studies illustrating how agencies, software houses, and consultants use Technova CRM.",
  path: MARKETING_ROUTES.customers,
});

export default function CustomersPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Customers</SectionEyebrow>
          <SectionHeading
            className="mt-4"
            title="Demo case studies."
            lead="Portfolio illustrations for product storytelling — not presented as real customer logos or testimonials."
          />
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {d.caseStudies.map((c) => (
              <article
                key={c.segment}
                className="rounded-xl border border-white/10 bg-[#101010] p-6"
              >
                <DemoBadge>{c.label}</DemoBadge>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--mk-bronze)]">
                  {c.segment}
                </p>
                <h2 className="mt-3 text-2xl text-[var(--mk-text)]">{c.headline}</h2>
                <dl className="mt-6 space-y-3">
                  {c.metrics.map((m) => (
                    <div key={m.label} className="flex justify-between text-sm">
                      <dt className="text-[var(--mk-muted)]">{m.label}</dt>
                      <dd className="text-[var(--mk-warm)]">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <div className="mt-12">
            <MagneticButton href="/register">Start your workspace</MagneticButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
