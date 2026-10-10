import Link from "next/link";
import { MarketingShell } from "@/components/marketing/shell";
import {
  DemoBadge,
  MagneticButton,
  SectionEyebrow,
} from "@/components/marketing/primitives";
import {
  BRAND,
  HOME_FAQ,
  LIFECYCLE_STAGES,
  SECURITY_POINTS,
} from "@/lib/marketing/copy";
import {
  formatDemoMoney,
  formatDemoPercent,
  marketingDemoData as d,
} from "@/lib/marketing/demo-data";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

const AUDIENCES = ["Digital agencies", "Software houses", "Consultants", "Freelancers"];

const PROBLEMS = [
  ["Pipeline spreadsheet", "Opportunities board"],
  ["Proposals in docs", "Proposals on the deal"],
  ["Bids over email", "Scored bid comparison"],
  ["Separate time tracker", "Time on the project"],
  ["Another invoicing app", "Invoices from contracts"],
] as const;

const FEATURES = [
  {
    eyebrow: "CRM",
    title: "Know every client.",
    body: "Leads, companies, contacts and clients — with history, health, projects and invoices in one relationship view.",
    href: MARKETING_ROUTES.crm,
  },
  {
    eyebrow: "Bidding",
    title: "Find the right work. Bid with confidence.",
    body: "Publish requests, compare and score bids, negotiate, and accept — without exposing competing private bids.",
    href: MARKETING_ROUTES.bidding,
  },
  {
    eyebrow: "Projects",
    title: "Everyone knows what happens next.",
    body: "Requirements, milestones, tasks, files and team in one place — with time and progress on the project.",
    href: MARKETING_ROUTES.projectManagement,
  },
  {
    eyebrow: "Finance",
    title: "Know where every dollar goes.",
    body: "Contracts, invoices, payments and expenses — with project-level profitability from revenue, cost and fees.",
    href: MARKETING_ROUTES.finance,
  },
] as const;

const REVENUE_BARS = [42, 50, 38, 58, 64, 52, 72, 70, 80, 86, 94, 60];

function HeroPreview() {
  const tiles = [
    { label: "Pipeline", value: formatDemoMoney(d.pipeline) },
    { label: "Revenue", value: formatDemoMoney(d.revenue) },
    { label: "Win rate", value: formatDemoPercent(d.winRate) },
    { label: "Utilization", value: `${d.teamUtilization}%` },
  ];
  return (
    <div className="mx-auto mt-10 w-full max-w-[1120px] overflow-hidden rounded-t-[18px] border border-b-0 border-[#d5d9e0] bg-white text-left shadow-[0_30px_80px_rgb(17_20_26_/_0.14)]">
      <div className="flex h-10 items-center gap-2 border-b border-[#e4e7ec] bg-[#fafbfc] px-4">
        <span className="size-2.5 rounded-full bg-[#d5d9e0]" />
        <span className="size-2.5 rounded-full bg-[#d5d9e0]" />
        <span className="size-2.5 rounded-full bg-[#d5d9e0]" />
        <span className="ml-auto">
          <DemoBadge>Demo workspace</DemoBadge>
        </span>
      </div>
      <div className="flex min-h-[340px]">
        <div className="hidden w-44 shrink-0 flex-col gap-1.5 border-r border-[#e4e7ec] p-3 text-[13px] text-[#4a5160] md:flex">
          <span className="rounded-lg bg-[#eef1fe] px-2.5 py-1.5 font-semibold text-[#1a33b0]">Dashboard</span>
          {["Leads", "Opportunities", "Bidding", "Projects", "Invoices", "Reports"].map((item) => (
            <span key={item} className="px-2.5 py-1.5">
              {item}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3.5 bg-[#f5f6f8] p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-[10px] border border-[#e4e7ec] bg-white p-3">
                <p className="text-xs text-[#5b6271]">{tile.label}</p>
                <p className="mt-1 font-mono text-lg font-semibold text-[#11141a] sm:text-[22px]">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-1 flex-col justify-between gap-3 rounded-[10px] border border-[#e4e7ec] bg-white p-3">
            <p className="text-[13px] font-semibold text-[#11141a]">Revenue</p>
            <div className="flex h-36 items-end gap-2" aria-hidden>
              {REVENUE_BARS.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${value}%`,
                    background: index === 10 ? "#2443d9" : "#c9d2fb",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketingHome() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="mk-grid-bg border-b border-[var(--mk-line)] bg-[var(--mk-bg-2)]">
        <div className="mk-container flex flex-col items-center gap-7 pt-16 text-center sm:pt-24">
          <span className="inline-flex h-[34px] items-center gap-2.5 rounded-full border border-[var(--mk-line)] bg-white px-3.5 text-sm text-[#3b4250]">
            <span className="size-2 rounded-full bg-[var(--mk-bronze)]" />
            CRM · Bidding · Projects · Finance · Portals
          </span>
          <h1 className="mk-display max-w-[980px] text-[44px] leading-[0.98] sm:text-7xl lg:text-[92px]">
            Win the client.
            <br />
            <span className="text-[var(--mk-muted)]">Then run the business.</span>
          </h1>
          <p className="max-w-[620px] text-lg leading-relaxed text-[var(--mk-text-2)] sm:text-[19px]">
            {BRAND.pitch}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <MagneticButton href="/register">Start free</MagneticButton>
            <MagneticButton href="#lifecycle" variant="secondary">
              See how it works
            </MagneticButton>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* Audiences */}
      <section className="mk-container flex flex-wrap items-center justify-between gap-5 border-b border-[var(--mk-line)] py-10">
        <span className="text-[15px] text-[var(--mk-muted)]">
          Built for teams that sell work, staff it and get paid
        </span>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {AUDIENCES.map((name) => (
            <span key={name} className="font-display text-xl font-semibold text-[#3b4250]">
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* Problem */}
      <section className="mk-ink">
        <div className="mk-container flex flex-wrap items-center gap-16 py-24 sm:py-28">
          <div className="flex min-w-0 flex-1 basis-[440px] flex-col gap-5">
            <SectionEyebrow>The problem</SectionEyebrow>
            <h2 className="mk-display text-[36px] leading-[1.04] sm:text-[60px]">
              Twelve tabs to run one client.
            </h2>
            <p className="max-w-[480px] text-lg leading-relaxed text-[var(--mk-text-2)]">
              The deal lives in a spreadsheet, the proposal in a doc, the bid in email, the hours in a
              timer and the invoice in another app. Nobody sees the whole picture — least of all the
              margin.
            </p>
          </div>
          <ul className="flex min-w-0 flex-1 basis-[440px] flex-col gap-2.5">
            {PROBLEMS.map(([old, next]) => (
              <li
                key={old}
                className="flex items-center gap-4 rounded-xl border border-[var(--mk-line)] px-5 py-4"
              >
                <span className="flex-1 text-base text-[var(--mk-muted)] line-through">{old}</span>
                <span className="text-[#5b6271]" aria-hidden>
                  →
                </span>
                <span className="flex-1 text-base font-medium">{next}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Lifecycle */}
      <section id="lifecycle" className="mk-container mk-section flex flex-col gap-12 py-24 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-[640px] flex-col gap-4">
            <SectionEyebrow>One lifecycle</SectionEyebrow>
            <h2 className="mk-display text-[34px] leading-[1.04] sm:text-[56px]">
              From first conversation to final payment.
            </h2>
          </div>
          <p className="max-w-[380px] text-[17px] leading-relaxed text-[var(--mk-text-2)]">
            Each stage hands its record to the next — nothing is re-typed, nothing gets lost.
          </p>
        </div>
        <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--mk-line)] bg-[var(--mk-line)] sm:grid-cols-3 lg:grid-cols-9">
          {LIFECYCLE_STAGES.map((stage, index) => {
            const last = index === LIFECYCLE_STAGES.length - 1;
            return (
              <li
                key={stage.id}
                className={
                  last
                    ? "mk-ink flex flex-col gap-3.5 p-5"
                    : "flex flex-col gap-3.5 bg-white p-5"
                }
              >
                <span className="font-mono text-[13px] text-[var(--mk-bronze)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-xl font-semibold">{stage.title}</span>
                <span className="text-sm leading-relaxed text-[var(--mk-text-2)]">{stage.body}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Features */}
      <section className="border-y border-[var(--mk-line)] bg-[var(--mk-bg-2)]">
        <div className="mk-container grid gap-6 py-24 sm:py-28 lg:grid-cols-2">
          {FEATURES.map((feature) => (
            <article
              key={feature.eyebrow}
              className="flex flex-col gap-4 rounded-[20px] border border-[var(--mk-line)] bg-white p-8 sm:p-9"
            >
              <SectionEyebrow>{feature.eyebrow}</SectionEyebrow>
              <h3 className="font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[32px]">
                {feature.title}
              </h3>
              <p className="text-base leading-relaxed text-[var(--mk-text-2)]">{feature.body}</p>
              <Link
                href={feature.href}
                className="mt-auto pt-2 text-[15px] font-semibold text-[var(--mk-bronze)] hover:underline"
              >
                Explore {feature.eyebrow} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section className="mk-container flex flex-col gap-6 py-24 sm:py-28">
        <div className="mb-4 flex max-w-[720px] flex-col gap-4">
          <SectionEyebrow>Portals</SectionEyebrow>
          <h2 className="mk-display text-[34px] leading-[1.04] sm:text-[56px]">
            Everyone sees exactly what they should.
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Link
            href={MARKETING_ROUTES.clientPortal}
            className="flex flex-col gap-4 rounded-[20px] bg-[#2443d9] p-9 text-white"
          >
            <span className="font-display text-[28px] font-semibold">Client portal</span>
            <span className="text-base leading-relaxed text-[#dce3fd]">
              Progress, milestones, deliverables and invoices — without bidding internals or
              freelancer costs.
            </span>
          </Link>
          <Link
            href={MARKETING_ROUTES.freelancerPortal}
            className="mk-ink flex flex-col gap-4 rounded-[20px] p-9"
          >
            <span className="font-display text-[28px] font-semibold">Freelancer portal</span>
            <span className="text-base leading-relaxed text-[var(--mk-text-2)]">
              Eligible requests, their own bids, assigned work and time — never agency margin or
              competing rates.
            </span>
          </Link>
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-[var(--mk-line)] bg-[var(--mk-bg-2)]">
        <div className="mk-container flex flex-wrap gap-16 py-24 sm:py-28">
          <div className="flex min-w-0 flex-1 basis-[340px] flex-col gap-4">
            <SectionEyebrow>Security</SectionEyebrow>
            <h2 className="mk-display text-[32px] leading-[1.06] sm:text-5xl">
              Your business data, isolated by design.
            </h2>
            <Link
              href={MARKETING_ROUTES.security}
              className="text-[15px] font-semibold text-[var(--mk-bronze)] hover:underline"
            >
              Read the security overview →
            </Link>
          </div>
          <div className="grid min-w-0 flex-[2] basis-[640px] gap-x-8 gap-y-7 sm:grid-cols-2">
            {SECURITY_POINTS.map((point) => (
              <div key={point.title} className="flex flex-col gap-2 border-t-2 border-[var(--mk-text)] pt-5">
                <span className="text-[17px] font-semibold">{point.title}</span>
                <span className="text-[15px] leading-relaxed text-[var(--mk-text-2)]">{point.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-container flex flex-wrap gap-16 py-24 sm:py-28">
        <div className="min-w-0 flex-1 basis-[340px]">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mk-display mt-4 text-[32px] leading-[1.06] sm:text-5xl">Questions, answered.</h2>
        </div>
        <div className="min-w-0 flex-[2] basis-[640px]">
          {HOME_FAQ.map((item, index) => (
            <details
              key={item.q}
              open={index === 0}
              className="group border-t border-[var(--mk-line)] py-6"
            >
              <summary className="flex cursor-pointer list-none justify-between gap-6 text-lg font-semibold sm:text-[19px] [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="font-mono text-[var(--mk-bronze)] group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3.5 max-w-[640px] text-base leading-relaxed text-[var(--mk-text-2)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mk-container pb-24 sm:pb-28">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-[#2443d9] px-8 py-16 text-white sm:px-12 sm:py-[72px]">
          <h2 className="mk-display max-w-[680px] text-[34px] leading-[1.02] text-white sm:text-6xl">
            Run the whole client lifecycle in one place.
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="mk-focus-ring inline-flex min-h-[52px] items-center rounded-xl bg-white px-6 text-base font-semibold text-[#11141a] hover:bg-[#eef1fe]"
            >
              Start free
            </Link>
            <Link
              href={MARKETING_ROUTES.contact}
              className="mk-focus-ring inline-flex min-h-[52px] items-center rounded-xl border border-[#8ea1f2] px-6 text-base font-semibold text-white hover:bg-white/10"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
