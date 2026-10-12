import Link from "next/link";
import type { ReactNode } from "react";
import { MarketingShell } from "@/components/marketing/shell";
import {
  MagneticButton,
  SectionEyebrow,
} from "@/components/marketing/primitives";
import { DemoBadge } from "@/components/marketing/primitives";
import { cn } from "@/lib/utils/cn";

export type ProductPageProps = {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  metaphor?: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  problem: { title: string; body: string };
  solution: { title: string; body: string };
  workflow: string[];
  features: { title: string; body: string }[];
  uiTitle: string;
  uiItems: string[];
  useCases?: { title: string; body: string }[];
  faq?: { q: string; a: string }[];
  nextLinks: { href: string; label: string }[];
  visual?: ReactNode;
};

/** Hero preview for pages without a custom `visual` — built only from the page's own copy. */
function DefaultPreview({
  title,
  items,
  workflow,
}: {
  title: string;
  items: string[];
  workflow: string[];
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--mk-line)] bg-[var(--mk-surface)] shadow-[0_30px_80px_rgb(17_20_26_/_0.12)]">
      <div className="flex h-10 items-center gap-2 border-b border-[var(--mk-line)] bg-[var(--mk-bg-2)] px-4">
        <span className="size-2.5 rounded-full bg-[#d5d9e0]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#d5d9e0]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#d5d9e0]" aria-hidden />
        <span className="ml-auto">
          <DemoBadge>Product preview</DemoBadge>
        </span>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:p-6">
        <p className="font-display text-[17px] font-semibold text-[var(--mk-text)]">{title}</p>
        <ul className="flex flex-col gap-2">
          {items.slice(0, 5).map((item, index) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-xl border border-[var(--mk-line)] px-3.5 py-3 text-sm"
            >
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: index === 0 ? "#2443d9" : "#c9d2fb" }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-medium text-[var(--mk-text)]">
                {item}
              </span>
              <span className="text-[var(--mk-muted)]" aria-hidden>
                →
              </span>
            </li>
          ))}
        </ul>
        {workflow.length ? (
          <ol className="mt-1 flex flex-wrap items-center gap-1.5 border-t border-[var(--mk-line)] pt-4">
            {workflow.map((step, index) => (
              <li key={step} className="flex items-center gap-1.5">
                <span className="inline-flex h-7 items-center rounded-full bg-[var(--mk-bg-2)] px-2.5 text-xs font-medium text-[var(--mk-text-2)]">
                  {step}
                </span>
                {index < workflow.length - 1 ? (
                  <span className="text-xs text-[var(--mk-muted)]" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}

export function ProductLandingPage(props: ProductPageProps) {
  const {
    eyebrow,
    title,
    lead,
    primaryCta = { href: "/register", label: "Start free" },
    secondaryCta,
    problem,
    solution,
    workflow,
    features,
    uiTitle,
    uiItems,
    useCases,
    faq,
    nextLinks,
    visual,
  } = props;

  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-[var(--mk-line)] bg-[var(--mk-bg-2)] px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="pointer-events-none absolute inset-0 mk-grid-bg opacity-70" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <SectionEyebrow>{eyebrow}</SectionEyebrow>
            <h1 className="mk-display mt-4 text-balance text-[2.6rem] leading-[1] text-[var(--mk-text)] sm:text-6xl lg:text-[76px]">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--mk-text-2)] sm:text-[19px]">
              {lead}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <MagneticButton href={primaryCta.href} className="w-full sm:w-auto">
                {primaryCta.label}
              </MagneticButton>
              {secondaryCta ? (
                <MagneticButton
                  href={secondaryCta.href}
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {secondaryCta.label}
                </MagneticButton>
              ) : null}
            </div>
          </div>
          <div className="relative min-h-[14rem] min-w-0 sm:min-h-[16rem]">
            {visual ?? (
              <DefaultPreview title={uiTitle} items={uiItems} workflow={workflow} />
            )}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-3.5 rounded-[20px] border border-[var(--mk-line)] bg-[var(--mk-bg-2)] p-8 sm:p-10">
            <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-[#b93a0a]">
              The problem
            </p>
            <h2 className="mk-display text-[28px] leading-[1.08] text-[var(--mk-text)] sm:text-[34px]">
              {problem.title}
            </h2>
            <p className="text-base leading-relaxed text-[var(--mk-text-2)] sm:text-[17px]">
              {problem.body}
            </p>
          </div>
          <div className="mk-ink flex flex-col gap-3.5 rounded-[20px] p-8 sm:p-10">
            <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-[var(--mk-bronze)]">
              With Technova
            </p>
            <h2 className="mk-display text-[28px] leading-[1.08] text-[var(--mk-text)] sm:text-[34px]">
              {solution.title}
            </h2>
            <p className="text-base leading-relaxed text-[var(--mk-text-2)] sm:text-[17px]">
              {solution.body}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Workflow</SectionEyebrow>
          <ol className="mt-8 flex flex-wrap items-center gap-2">
            {workflow.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="inline-flex h-9 items-center rounded-full border border-[var(--mk-line)] bg-[var(--mk-surface)] px-3.5 text-[13px] font-medium text-[var(--mk-text)]">
                  {step}
                </span>
                {i < workflow.length - 1 ? (
                  <span className="text-[var(--mk-bronze)]" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-[var(--mk-line)] bg-[var(--mk-bg-2)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <SectionEyebrow>Capabilities</SectionEyebrow>
            <DemoBadge>Product preview</DemoBadge>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-[18px] border border-[var(--mk-line)] bg-[var(--mk-surface)] p-7"
              >
                <p className="font-display text-[21px] font-semibold text-[var(--mk-text)]">
                  {f.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mk-text-2)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>{uiTitle}</SectionEyebrow>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {uiItems.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-[var(--mk-line)] bg-[var(--mk-surface)] px-4 py-3 text-sm text-[var(--mk-text-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {useCases?.length ? (
        <section className="border-t border-[var(--mk-line)] bg-[var(--mk-bg-2)] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionEyebrow>Use cases</SectionEyebrow>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {useCases.map((u) => (
                <div
                  key={u.title}
                  className="rounded-[18px] border border-[var(--mk-line)] bg-[var(--mk-surface)] p-7"
                >
                  <p className="font-medium">{u.title}</p>
                  <p className="mt-2 text-sm text-[var(--mk-text-2)]">{u.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {faq?.length ? (
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <SectionEyebrow>FAQ</SectionEyebrow>
            <div className="mt-8 space-y-3">
              {faq.map((item) => (
                <details
                  key={item.q}
                  className="rounded-lg border border-[var(--mk-line)] bg-[var(--mk-surface)] px-5 py-4"
                >
                  <summary className="cursor-pointer text-sm font-medium">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm text-[var(--mk-text-2)]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-[var(--mk-line)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Continue</SectionEyebrow>
          <div className="mt-6 flex flex-wrap gap-3">
            {nextLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-xl border border-[var(--mk-line)] bg-[var(--mk-surface)] px-4 py-3 text-[15px] font-medium text-[var(--mk-text)] transition-colors hover:border-[var(--mk-bronze)] hover:text-[var(--mk-bronze)]",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 rounded-3xl bg-[#2443d9] px-8 py-14 text-white sm:px-12 sm:py-16">
          <div className="max-w-2xl space-y-3">
            <h2 className="mk-display text-[32px] leading-[1.04] text-white sm:text-[48px]">
              Run the whole client lifecycle in one place.
            </h2>
            <p className="text-[17px] text-[#dce3fd]">
              Connected to CRM, bidding, projects and finance from day one.
            </p>
          </div>
          <Link
            href={primaryCta.href}
            className="mk-focus-ring inline-flex min-h-[52px] items-center rounded-xl bg-white px-6 text-base font-semibold text-[#11141a] hover:bg-[#eef1fe]"
          >
            {primaryCta.label}
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
