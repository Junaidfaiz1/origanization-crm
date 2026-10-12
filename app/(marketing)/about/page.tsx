import { MarketingShell } from "@/components/marketing/shell";
import {
  MagneticButton,
  SectionEyebrow,
  SectionHeading,
} from "@/components/marketing/primitives";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";
import { BRAND } from "@/lib/marketing/copy";

export const metadata = marketingMetadata({
  title: "About",
  description:
    "Mission, product philosophy, and design principles behind Technova CRM.",
  path: MARKETING_ROUTES.about,
});

const PRINCIPLES = [
  {
    title: "One source of truth",
    body: "Chaos collapses into a single workspace — not another tab.",
  },
  {
    title: "Honest boundaries",
    body: "Clients, freelancers, and internal teams see what they should — nothing more.",
  },
  {
    title: "Server-enforced rules",
    body: "Permissions and tenant scope live in services, not only in the UI.",
  },
  {
    title: "Finance is not an afterthought",
    body: "Margin belongs beside delivery, not in a month-end spreadsheet.",
  },
] as const;

const TIMELINE = [
  { y: "Foundation", t: "Multi-tenant CRM core" },
  { y: "Delivery", t: "Projects, tasks, time, resources" },
  { y: "Bidding", t: "Private bids and award transactions" },
  { y: "Finance", t: "Invoices, payments, profitability" },
  { y: "Portals", t: "Client and freelancer surfaces" },
  { y: "Studio", t: "Cinematic product storytelling site" },
] as const;

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>About</SectionEyebrow>
          <h1 className="mk-display mt-4 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            {BRAND.name}
            <span className="mt-3 block text-2xl text-[var(--mk-text-2)] sm:text-3xl">
              {BRAND.tagline}
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--mk-text-2)]">
            We build software for the businesses that sell expertise and ship
            work — agencies, software houses, consultants, and freelancers who
            need CRM, delivery, and finance in one intelligent system.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--mk-line)] bg-[var(--mk-bg-2)] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading title="Product philosophy" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-[var(--mk-line)] bg-[var(--mk-surface)] p-6"
              >
                <h2 className="text-lg font-medium">{p.title}</h2>
                <p className="mt-3 text-sm text-[var(--mk-text-2)]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow>Timeline</SectionEyebrow>
          <ol className="mt-10 space-y-6 border-l border-[var(--mk-line)] pl-6">
            {TIMELINE.map((item) => (
              <li key={item.y} className="relative">
                <span className="absolute -left-[1.7rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--mk-bronze)]" />
                <p className="text-xs uppercase tracking-[0.06em] text-[var(--mk-muted)]">
                  {item.y}
                </p>
                <p className="mt-1 text-[var(--mk-text)]">{item.t}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <MagneticButton href={MARKETING_ROUTES.contact}>
              Contact the team
            </MagneticButton>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
