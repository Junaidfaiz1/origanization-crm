import Link from "next/link";
import { MarketingShell } from "@/components/marketing/shell";
import {
  SectionEyebrow,
  SectionHeading,
} from "@/components/marketing/primitives";
import { marketingDemoData as d } from "@/lib/marketing/demo-data";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Guides",
  description:
    "Static guides on agency profitability, pipelines, proposals, and project margin — Technova resources.",
  path: MARKETING_ROUTES.guides,
});

export default function GuidesPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Resources</SectionEyebrow>
          <SectionHeading
            className="mt-4"
            title="Guides for operators."
            lead="Static articles for product storytelling. Not connected to a CMS yet."
          />
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {d.articles.map((a) => (
              <article
                key={a.slug}
                className="rounded-xl border border-white/10 bg-[#101010] p-6"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--mk-muted)]">
                  Article
                </p>
                <h2 className="mt-3 text-xl text-[var(--mk-text)]">{a.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--mk-text-2)]">
                  {a.excerpt}
                </p>
                <p className="mt-4 text-xs text-[var(--mk-bronze)]">
                  Placeholder · full article coming later
                </p>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm text-[var(--mk-muted)]">
            Prefer a walkthrough?{" "}
            <Link
              href={MARKETING_ROUTES.contact}
              className="mk-underline text-[var(--mk-text-2)]"
            >
              Contact the team
            </Link>
            .
          </p>
        </div>
      </section>
    </MarketingShell>
  );
}
