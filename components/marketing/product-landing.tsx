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

export function ProductLandingPage(props: ProductPageProps) {
  const {
    eyebrow,
    title,
    lead,
    metaphor,
    primaryCta = { href: "/register", label: "Get started" },
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
      <section className="relative overflow-hidden px-4 pb-12 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 mk-editorial-grid opacity-30" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12">
          <div className="min-w-0">
            <SectionEyebrow>{eyebrow}</SectionEyebrow>
            <h1 className="mk-display mt-3 text-balance text-[2.1rem] leading-[1.08] text-[var(--mk-text)] sm:mt-4 sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--mk-text-2)] sm:mt-6 sm:text-lg">
              {lead}
            </p>
            {metaphor ? (
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                Visual · {metaphor}
              </p>
            ) : null}
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
              <div className="flex h-full min-h-[14rem] items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[#151515] via-[#0a0a0a] to-[#050505] p-6 sm:min-h-[16rem] sm:p-8">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 rounded-full border border-[var(--mk-bronze)]/35 bg-[var(--mk-bronze)]/10 shadow-[0_0_60px_rgb(198_138_82_/_0.2)] sm:h-20 sm:w-20" />
                  <p className="mt-4 text-xs tracking-[0.2em] text-[var(--mk-warm)]">
                    {eyebrow}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--mk-muted)]">
              Problem
            </p>
            <h2 className="mk-display mt-3 text-3xl text-[var(--mk-text)]">
              {problem.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--mk-text-2)]">
              {problem.body}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--mk-muted)]">
              Solution
            </p>
            <h2 className="mk-display mt-3 text-3xl text-[var(--mk-text)]">
              {solution.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--mk-text-2)]">
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
                <span className="rounded-md border border-white/10 bg-[#101010] px-3 py-2 text-xs text-[var(--mk-text-2)]">
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

      <section className="border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <SectionEyebrow>Capabilities</SectionEyebrow>
            <DemoBadge>Product preview</DemoBadge>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-white/10 bg-[#101010] p-5"
              >
                <p className="text-sm font-medium text-[var(--mk-text)]">
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
                className="rounded-lg border border-white/10 bg-[#101010] px-4 py-3 text-sm text-[var(--mk-text-2)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {useCases?.length ? (
        <section className="border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionEyebrow>Use cases</SectionEyebrow>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {useCases.map((u) => (
                <div
                  key={u.title}
                  className="rounded-lg border border-white/10 bg-[#101010] p-5"
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
                  className="rounded-lg border border-white/10 bg-[#101010] px-5 py-4"
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

      <section className="border-t border-white/[0.06] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Continue</SectionEyebrow>
          <div className="mt-6 flex flex-wrap gap-3">
            {nextLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md border border-white/10 bg-[#101010] px-4 py-3 text-sm text-[var(--mk-text-2)] transition-colors hover:border-[var(--mk-bronze)]/40 hover:text-[var(--mk-text)]",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
