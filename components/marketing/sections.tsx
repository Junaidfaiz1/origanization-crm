"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  formatDemoMoney,
  formatDemoPercent,
  marketingDemoData as d,
} from "@/lib/marketing/demo-data";
import { BRAND, HOME_FAQ, SECURITY_POINTS } from "@/lib/marketing/copy";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";
import {
  AnimatedNumber,
  DemoBadge,
  MagneticButton,
  ScrollReveal,
  SectionEyebrow,
  SectionHeading,
} from "@/components/marketing/primitives";
import {
  MetricTile,
  ProductWindow,
  SparkBars,
} from "@/components/marketing/product-window";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";
import { cn } from "@/lib/utils/cn";
import { LifecycleRail } from "@/components/marketing/lifecycle-rail";


function DashboardPreview() {
  return (
    <ProductWindow activeNav="Overview" className="max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--mk-muted)]">
          Overview
        </p>
        <DemoBadge>{d.workspaceLabel}</DemoBadge>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricTile
          label="Revenue"
          value={formatDemoMoney(d.revenue)}
          delta={`+${d.revenueDelta}%`}
        />
        <MetricTile label="Active projects" value={String(d.activeProjects)} />
        <MetricTile label="Pipeline" value={formatDemoMoney(d.pipeline)} />
        <MetricTile label="Win rate" value={formatDemoPercent(d.winRate)} />
        <MetricTile label="Profit" value={formatDemoMoney(d.grossProfit)} />
        <MetricTile label="Clients" value={String(d.clients)} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/[0.06] p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
            Revenue
          </p>
          <SparkBars values={d.revenueSeries} />
        </div>
        <div className="rounded-lg border border-white/[0.06] p-3">
          <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
            Activity
          </p>
          <ul className="space-y-2">
            {d.activity.slice(0, 4).map((a) => (
              <li
                key={a.time + a.text}
                className="flex gap-2 text-[11px] text-[var(--mk-text-2)]"
              >
                <span className="text-[var(--mk-muted)]">{a.time}</span>
                <span className="truncate">{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProductWindow>
  );
}

export function MarketingSections() {
  const setScrollProgress = useMarketingSceneStore((s) => s.setScrollProgress);
  const setActiveSection = useMarketingSceneStore((s) => s.setActiveSection);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      const ids = [
        "hero",
        "problem",
        "lifecycle",
        "crm",
        "bidding",
        "projects",
        "finance",
        "cta",
      ];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.35) {
          setActiveSection(id);
        }
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [setScrollProgress, setActiveSection]);

  return (
    <>
      {/* Hero */}
      <section
        id="hero"
        className="mk-section relative flex min-h-[calc(100dvh-4rem)] flex-col justify-end px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24 lg:justify-center lg:px-8 lg:pb-28"
      >
        <div className="pointer-events-none absolute inset-0 mk-editorial-grid opacity-40" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-marketing-display)] text-lg tracking-[0.08em] text-[var(--mk-warm)] sm:text-2xl">
              Technova
            </p>
            <h1 className="mk-display mt-3 max-w-xl text-balance text-[2.35rem] leading-[1.05] text-[var(--mk-text)] sm:mt-4 sm:text-5xl lg:text-7xl">
              Win the client.
              <span className="mt-2 block text-[var(--mk-text-2)]">
                Then run the business.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-[var(--mk-text-2)] sm:mt-6 sm:text-lg">
              {BRAND.pitch}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
              <MagneticButton href={MARKETING_ROUTES.features} className="w-full sm:w-auto">
                Explore the platform
              </MagneticButton>
              <MagneticButton
                href="#lifecycle"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                See how it works
              </MagneticButton>
            </div>
          </div>
          <div className="relative hidden min-w-0 lg:block">
            <div className="translate-y-4 rotate-[-1.5deg] scale-[0.98] transition-transform duration-700 hover:translate-y-0 hover:rotate-0 hover:scale-100">
              <DashboardPreview />
            </div>
          </div>
        </div>
        <div className="relative mx-auto mt-10 w-full max-w-6xl min-w-0 lg:hidden">
          <DashboardPreview />
        </div>
      </section>

      {/* Problem */}
      <section
        id="problem"
        className="mk-section relative border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>The problem</SectionEyebrow>
            <h2 className="mk-display mt-4 max-w-4xl text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              Your business{" "}
              <span className="text-[var(--mk-text-2)]">shouldn&apos;t live in</span>{" "}
              <span className="mk-accent-italic text-[var(--mk-warm)]">
                twelve tabs.
              </span>
            </h2>
          </ScrollReveal>
          <div className="relative mt-12 grid gap-3 sm:mt-16 sm:grid-cols-3 sm:gap-4">
            {[
              "Leads in spreadsheets",
              "Proposals in documents",
              "Conversations in email",
              "Projects in another tool",
              "Invoices somewhere else",
              "Profitability by hand",
            ].map((label, i) => (
              <ScrollReveal key={label} delay={i * 60}>
                <div
                  className={cn(
                    "rounded-lg border border-white/10 bg-[#101010] px-4 py-4 text-sm text-[var(--mk-text-2)] sm:py-5",
                    i % 2 === 0 ? "md:-translate-y-2" : "md:translate-y-3",
                    i % 3 === 1 && "md:rotate-1",
                    i % 3 === 2 && "md:-rotate-1",
                  )}
                >
                  {label}
                </div>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal className="mt-16">
            <p className="mk-display text-3xl text-[var(--mk-text)] sm:text-4xl">
              One workspace. One source of truth.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Lifecycle */}
      <section
        id="lifecycle"
        className="mk-section relative px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
      >
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Business OS</SectionEyebrow>
            <SectionHeading
              title="From first conversation"
              accent="to final payment."
              lead="A continuous lifecycle — not a pile of disconnected apps."
            />
          </ScrollReveal>
          <LifecycleRail />
        </div>
      </section>

      {/* CRM */}
      <section
        id="crm"
        className="mk-section border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <ScrollReveal>
            <SectionEyebrow>CRM</SectionEyebrow>
            <SectionHeading
              title="Know every client"
              accent="before the next meeting."
              lead="History, health, projects, and invoices in one relationship view."
            />
            <div className="mt-8">
              <MagneticButton href={MARKETING_ROUTES.crm} variant="secondary">
                Explore CRM
              </MagneticButton>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={120}>
            <ProductWindow activeNav="Clients">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-medium text-[var(--mk-text)]">
                    {d.client.name}
                  </p>
                  <p className="text-xs text-[var(--mk-muted)]">
                    {d.client.industry} · {d.client.status}
                  </p>
                </div>
                <DemoBadge>Example</DemoBadge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <MetricTile
                  label="Lifetime value"
                  value={formatDemoMoney(d.client.ltv)}
                />
                <MetricTile label="Projects" value={String(d.client.projects)} />
                <MetricTile
                  label="Satisfaction"
                  value={`${d.client.satisfaction}%`}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/[0.06] p-3 text-xs text-[var(--mk-text-2)]">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                    Contact
                  </p>
                  <p className="mt-2">{d.client.contact}</p>
                  <p>{d.client.email}</p>
                  <p>{d.client.phone}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] p-3 text-xs text-[var(--mk-text-2)]">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                    Health
                  </p>
                  <p className="mt-2 text-[var(--mk-warm)]">{d.client.health}</p>
                  <p className="mt-2">Recent notes, invoices, and project pulse.</p>
                </div>
              </div>
            </ProductWindow>
          </ScrollReveal>
        </div>
      </section>

      {/* Pipeline */}
      <section className="mk-section px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Lead management</SectionEyebrow>
            <SectionHeading
              title="Turn conversations"
              accent="into opportunities."
            />
          </ScrollReveal>
          <div className="-mx-4 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:mt-12 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {["New Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"].map(
              (col) => {
                const cards = d.pipelineCards.filter((c) => c.column === col);
                return (
                  <div
                    key={col}
                    className="w-[78vw] max-w-[14rem] shrink-0 snap-start rounded-lg border border-white/10 bg-[#101010] p-3 sm:w-auto sm:min-w-[10.5rem] sm:max-w-none sm:flex-1"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                      {col}
                    </p>
                    <div className="mt-3 space-y-2">
                      {cards.map((card) => (
                        <div
                          key={card.name}
                          className="rounded-md border border-white/[0.06] bg-[#151515] p-3"
                        >
                          <p className="text-xs font-medium text-[var(--mk-text)]">
                            {card.name}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--mk-bronze)]">
                            {formatDemoMoney(card.value)}
                          </p>
                        </div>
                      ))}
                      {cards.length === 0 ? (
                        <div className="h-16 rounded-md border border-dashed border-white/10" />
                      ) : null}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Bidding */}
      <section
        id="bidding"
        className="mk-section border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <ScrollReveal>
            <SectionEyebrow>Bidding</SectionEyebrow>
            <SectionHeading
              title="Find the right work."
              accent="Bid with confidence."
              lead="Opportunity scoring, proposal drafting, and follow-up — without exposing competing private bids."
            />
            <div className="mt-8">
              <MagneticButton href={MARKETING_ROUTES.bidding} variant="secondary">
                Explore bidding
              </MagneticButton>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <ProductWindow activeNav="Bidding">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{d.bid.project}</p>
                <DemoBadge>Sample</DemoBadge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <MetricTile label="Platform" value={d.bid.platform} />
                <MetricTile label="Budget" value={d.bid.budget} />
                <MetricTile label="Competition" value={d.bid.competition} />
                <MetricTile label="Match score" value={`${d.bid.matchScore}%`} />
              </div>
              <ol className="mt-5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--mk-text-2)]">
                {[
                  "Opportunity",
                  "Analysis",
                  "Pricing",
                  "Proposal",
                  "Submission",
                  "Follow-up",
                ].map((step, i, arr) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="rounded border border-white/10 bg-white/[0.03] px-2 py-1">
                      {step}
                    </span>
                    {i < arr.length - 1 ? (
                      <span className="text-[var(--mk-bronze)]">↓</span>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[10px] text-[var(--mk-muted)]">
                Analysis shown as a static UI demonstration — not a live AI claim.
              </p>
            </ProductWindow>
          </ScrollReveal>
        </div>
      </section>

      {/* Proposal */}
      <section className="mk-section px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Proposals</SectionEyebrow>
            <SectionHeading title="Build proposals faster." />
          </ScrollReveal>
          <ScrollReveal className="mt-10" delay={80}>
            <ProductWindow title="PROPOSAL · DRAFT" activeNav="Overview">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-xl font-medium text-[var(--mk-text)]">
                    {d.proposal.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--mk-text-2)]">
                    {d.proposal.client} · {formatDemoMoney(d.proposal.value)} ·{" "}
                    {d.proposal.timeline}
                  </p>
                  <ul className="mt-6 space-y-2">
                    {d.proposal.sections.map((s) => (
                      <li
                        key={s}
                        className="rounded-md border border-white/[0.06] px-3 py-2 text-sm text-[var(--mk-text-2)]"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-[#090909] p-4 text-sm leading-relaxed text-[var(--mk-text-2)]">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                    Executive summary · preview
                  </p>
                  <p className="mt-3">
                    A structured transformation engagement covering CRM
                    consolidation, delivery cadence, and profitability visibility
                    across the client portfolio.
                  </p>
                </div>
              </div>
            </ProductWindow>
          </ScrollReveal>
        </div>
      </section>

      {/* Projects */}
      <section
        id="projects"
        className="mk-section border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <ScrollReveal>
            <SectionEyebrow>Projects</SectionEyebrow>
            <SectionHeading
              title="Once you win the work,"
              accent="deliver it beautifully."
            />
            <div className="mt-8">
              <MagneticButton
                href={MARKETING_ROUTES.projectManagement}
                variant="secondary"
              >
                Explore projects
              </MagneticButton>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <ProductWindow activeNav="Projects">
              <p className="text-sm font-medium">{d.project.name}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <MetricTile label="Progress" value={`${d.project.progress}%`} />
                <MetricTile
                  label="Tasks"
                  value={`${d.project.tasksDone} / ${d.project.tasksTotal}`}
                />
                <MetricTile
                  label="Budget"
                  value={`${formatDemoMoney(d.project.budgetUsed)}`}
                />
                <MetricTile label="Team" value={`${d.project.team} members`} />
                <MetricTile label="Deadline" value={d.project.deadline} />
                <MetricTile
                  label="Cap"
                  value={formatDemoMoney(d.project.budgetTotal)}
                />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--mk-bronze)]"
                  style={{ width: `${d.project.progress}%` }}
                />
              </div>
            </ProductWindow>
          </ScrollReveal>
        </div>
      </section>

      {/* Finance + Profitability */}
      <section
        id="finance"
        className="mk-section px-4 py-24 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Finance</SectionEyebrow>
            <SectionHeading title="Know where every dollar goes." />
          </ScrollReveal>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Revenue", value: d.revenue, prefix: "$" },
              { label: "Expenses", value: d.expenses, prefix: "$" },
              { label: "Gross profit", value: d.grossProfit, prefix: "$" },
              { label: "Margin", value: d.profitMargin, suffix: "%" },
              { label: "Outstanding", value: d.outstanding, prefix: "$" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-white/10 bg-[#101010] p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                  {m.label}
                </p>
                <p className="mt-3 text-2xl font-medium tracking-tight">
                  <AnimatedNumber
                    value={m.value}
                    prefix={m.prefix}
                    suffix={m.suffix}
                    decimals={m.suffix ? 1 : 0}
                  />
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <ProductWindow activeNav="Finance" compact>
              <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                Revenue trend
              </p>
              <SparkBars values={d.revenueSeries} />
            </ProductWindow>
            <div className="rounded-xl border border-white/10 bg-[#101010] p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium">Project profitability</p>
                <DemoBadge />
              </div>
              <ul className="space-y-4">
                {d.profitability.map((p) => (
                  <li key={p.name}>
                    <div className="flex items-center justify-between text-xs">
                      <span>{p.name}</span>
                      <span className="text-[var(--mk-bronze)]">{p.margin}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--mk-bronze)] to-[var(--mk-blue)]"
                        style={{ width: `${p.margin}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--mk-muted)]">
                      Rev {formatDemoMoney(p.revenue)} · Cost{" "}
                      {formatDemoMoney(p.cost)} · Profit{" "}
                      {formatDemoMoney(p.profit)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8">
            <MagneticButton href={MARKETING_ROUTES.finance} variant="secondary">
              Explore finance
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="mk-section border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Analytics</SectionEyebrow>
            <SectionHeading title="See the business behind the busy." />
          </ScrollReveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Revenue", formatDemoMoney(d.revenue)],
              ["Pipeline", formatDemoMoney(d.pipeline)],
              ["Win rate", formatDemoPercent(d.winRate)],
              ["Avg deal", formatDemoMoney(d.avgDealSize)],
              ["Project margin", formatDemoPercent(d.profitMargin)],
              ["Client growth", `+${d.clientGrowth}%`],
              ["Utilization", `${d.teamUtilization}%`],
              ["MRR", formatDemoMoney(d.mrr)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-[#101010] p-4"
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-xl font-medium">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <MagneticButton href={MARKETING_ROUTES.analytics} variant="secondary">
              Explore analytics
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mk-section px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Team</SectionEyebrow>
            <SectionHeading title="Everyone knows what happens next." />
          </ScrollReveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {d.team.map((m) => (
              <div
                key={m.name}
                className="rounded-lg border border-white/10 bg-[#101010] p-4"
              >
                <p className="font-medium text-[var(--mk-text)]">{m.name}</p>
                <p className="text-xs text-[var(--mk-muted)]">{m.role}</p>
                <div className="mt-4 space-y-2 text-xs text-[var(--mk-text-2)]">
                  <p>Utilization {m.utilization}%</p>
                  <p>Active tasks {m.tasks}</p>
                  <p>Availability · {m.availability}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Automation */}
      <section className="mk-section border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Automation</SectionEyebrow>
            <SectionHeading
              title="When work is won,"
              accent="the next steps already know."
              lead="Illustrative workflow pattern — wire to your process as the product grows."
            />
          </ScrollReveal>
          <ol className="mt-10 grid list-none gap-2 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            {[
              "WHEN · Proposal accepted",
              "Create project",
              "Assign team",
              "Create tasks",
              "Generate contract",
              "Notify finance",
              "Create invoice",
            ].map((step, i) => (
              <li
                key={step}
                className={cn(
                  "rounded-lg border px-4 py-3 text-xs sm:text-sm",
                  i === 0
                    ? "border-[var(--mk-bronze)]/40 bg-[var(--mk-bronze)]/10 text-[var(--mk-warm)] sm:col-span-2 lg:col-span-3"
                    : "border-white/10 bg-[#101010] text-[var(--mk-text-2)]",
                )}
              >
                <span className="mr-2 text-[10px] text-[var(--mk-muted)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Security */}
      <section className="mk-section border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Security</SectionEyebrow>
            <SectionHeading title="Your business data deserves serious protection." />
          </ScrollReveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY_POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-lg border border-white/10 bg-[#101010] p-5"
              >
                <p className="text-sm font-medium text-[var(--mk-text)]">
                  {p.title}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--mk-text-2)]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[var(--mk-muted)]">
            No SOC 2 / ISO / GDPR certification claims are made here.
          </p>
        </div>
      </section>

      {/* Case studies */}
      <section className="mk-section px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <SectionEyebrow>Stories</SectionEyebrow>
            <SectionHeading
              title="Demo case studies."
              lead="Portfolio illustrations — not presented as real customers."
            />
          </ScrollReveal>
          <div className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {d.caseStudies.map((c) => (
              <article
                key={c.segment}
                className="rounded-xl border border-white/10 bg-[#101010] p-6"
              >
                <DemoBadge>{c.label}</DemoBadge>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--mk-bronze)]">
                  {c.segment}
                </p>
                <h3 className="mt-3 text-xl text-[var(--mk-text)]">{c.headline}</h3>
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
        </div>
      </section>

      {/* FAQ */}
      <section className="mk-section px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mk-display mt-4 text-4xl">Questions, answered.</h2>
          <div className="mt-10 space-y-4">
            {HOME_FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-white/10 bg-[#101010] px-5 py-4"
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-[var(--mk-text)]">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--mk-text-2)]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="cta"
        className="mk-section relative overflow-hidden border-t border-white/[0.06] px-4 py-32 sm:px-6 lg:px-8"
      >
        <div className="pointer-events-none absolute inset-0 mk-radial-glow" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h2 className="mk-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
            Win the work.
            <br />
            Run the business.
            <br />
            Know the numbers.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[var(--mk-text-2)]">
            Everything your business needs. In one place.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <MagneticButton href="/register">Get started</MagneticButton>
            <MagneticButton href={MARKETING_ROUTES.features} variant="secondary">
              Explore the platform
            </MagneticButton>
          </div>
          <p className="mt-8">
            <Link
              href={MARKETING_ROUTES.contact}
              className="mk-underline text-sm text-[var(--mk-muted)]"
            >
              Or talk to us
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
