import { MarketingShell } from "@/components/marketing/shell";
import {
  SectionEyebrow,
  SectionHeading,
} from "@/components/marketing/primitives";
import { SECURITY_POINTS } from "@/lib/marketing/copy";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Security",
  description:
    "Multi-tenant architecture, role-based access, authentication, audit logs, and protected APIs in Technova CRM.",
  path: MARKETING_ROUTES.security,
});

export default function SecurityPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Security</SectionEyebrow>
          <SectionHeading
            className="mt-4"
            title="Your business data"
            accent="deserves serious protection."
            lead="We describe controls that exist in the product. We do not claim SOC 2, ISO 27001, or GDPR certification here."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SECURITY_POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-white/10 bg-[#101010] p-6"
              >
                <h2 className="text-base font-medium">{p.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--mk-text-2)]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-14 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a] p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--mk-muted)]">
              Technical sketch
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[var(--mk-text-2)]">
              {["Session", "Permissions", "Tenant scope", "Audit", "Storage"].map(
                (n, i, arr) => (
                  <span key={n} className="flex items-center gap-3">
                    <span className="rounded-md border border-[var(--mk-bronze)]/30 bg-[var(--mk-bronze)]/10 px-3 py-2 text-[var(--mk-warm)]">
                      {n}
                    </span>
                    {i < arr.length - 1 ? (
                      <span className="text-[var(--mk-muted)]">→</span>
                    ) : null}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
