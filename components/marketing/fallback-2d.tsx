"use client";

import Link from "next/link";
import { BRAND } from "@/lib/marketing/copy";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";
import {
  formatDemoMoney,
  formatDemoPercent,
  marketingDemoData as d,
} from "@/lib/marketing/demo-data";
import { MagneticButton, SectionHeading } from "@/components/marketing/primitives";
import {
  MetricTile,
  ProductWindow,
  SparkBars,
} from "@/components/marketing/product-window";

/** Lightweight non-WebGL homepage used when WebGL is unavailable. */
export function MarketingFallback2D() {
  return (
    <div className="relative">
      <section className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="font-[family-name:var(--font-marketing-display)] text-xl text-[var(--mk-warm)]">
            Technova
          </p>
          <h1 className="mk-display mt-4 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            Win the client.
            <span className="mt-2 block text-[var(--mk-text-2)]">
              Then run the business.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-[var(--mk-text-2)]">{BRAND.pitch}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <MagneticButton href={MARKETING_ROUTES.features}>
              Explore the platform
            </MagneticButton>
            <MagneticButton href="/register" variant="secondary">
              Get started
            </MagneticButton>
          </div>
          <div className="mt-14 max-w-xl">
            <ProductWindow>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <MetricTile
                  label="Revenue"
                  value={formatDemoMoney(d.revenue)}
                  delta={`+${d.revenueDelta}%`}
                />
                <MetricTile
                  label="Win rate"
                  value={formatDemoPercent(d.winRate)}
                />
                <MetricTile
                  label="Profit"
                  value={formatDemoMoney(d.grossProfit)}
                />
              </div>
              <div className="mt-4">
                <SparkBars values={d.revenueSeries} />
              </div>
            </ProductWindow>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            title="One workspace."
            accent="Every moving part."
            lead="CRM, bidding, projects, finance, and portals — without twelve tabs."
          />
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              ["CRM", MARKETING_ROUTES.crm],
              ["Bidding", MARKETING_ROUTES.bidding],
              ["Projects", MARKETING_ROUTES.projectManagement],
              ["Finance", MARKETING_ROUTES.finance],
              ["Analytics", MARKETING_ROUTES.analytics],
              ["Contact", MARKETING_ROUTES.contact],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--mk-text-2)] hover:border-[var(--mk-bronze)]/40"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
