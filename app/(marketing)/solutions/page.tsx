import Link from "next/link";
import { MarketingShell } from "@/components/marketing/shell";
import {
  MagneticButton,
  SectionEyebrow,
  SectionHeading,
} from "@/components/marketing/primitives";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES, SOLUTION_NAV } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Solutions",
  description:
    "Technova for agencies, software houses, consultants, and freelancers — industry-specific business workspaces.",
  path: MARKETING_ROUTES.solutions,
});

export default function SolutionsPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Solutions</SectionEyebrow>
          <SectionHeading
            as="h1"
            className="mt-4"
            title="Built for how service"
            accent="businesses actually work."
            lead="Choose the narrative closest to your team — then explore the same connected workspace."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {SOLUTION_NAV.map((s, i) => (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-xl border border-[var(--mk-line)] bg-[var(--mk-surface)] p-8 transition-colors hover:border-[var(--mk-bronze)]/40"
              >
                <p className="text-[11px] tracking-[0.06em] text-[var(--mk-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-2xl text-[var(--mk-text)] group-hover:text-[var(--mk-warm)]">
                  {s.title}
                </h2>
                <p className="mt-3 text-sm text-[var(--mk-text-2)]">{s.description}</p>
              </Link>
            ))}
          </div>
          <div className="mt-12">
            <MagneticButton href="/register">Get started</MagneticButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
