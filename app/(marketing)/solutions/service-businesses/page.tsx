import Link from "next/link";
import { MarketingShell } from "@/components/marketing/shell";
import { Button } from "@/components/ui/button";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Service businesses",
  description:
    "Customers, projects, team, and payments in one TechNova loop for service businesses.",
  path: MARKETING_ROUTES.serviceBusinesses,
});

const LOOP = ["Customer", "Project", "Team", "Deliver", "Invoice", "Paid"] as const;

export default function ServiceBusinessesSolutionPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 mk-grid-bg opacity-45" />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-300/95">
              Solution · Service businesses
            </p>
            <h1 className="mk-display mt-4 text-balance text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
              A simple loop
              <span className="mt-2 block text-slate-300">that actually closes.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400">
              Many service businesses do not need enterprise complexity — they
              need customers, projects, a team, and payments that stay linked.
              TechNova is that loop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="bg-teal-500 text-teal-950 hover:bg-teal-400">
                <Link href="/register">Start for free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/5 text-slate-100 hover:bg-white/10"
              >
                <Link href={MARKETING_ROUTES.features}>Feature map</Link>
              </Button>
            </div>
          </div>

          {/* Loop metaphor */}
          <div className="relative mx-auto h-72 w-72">
            <div className="absolute inset-4 rounded-full border-2 border-teal-500/25" />
            <div className="absolute inset-0 animate-[spin_28s_linear_infinite] rounded-full border border-dashed border-white/10" />
            {LOOP.map((label, i) => {
              const angle = (i / LOOP.length) * Math.PI * 2 - Math.PI / 2;
              const r = 112;
              const x = 144 + Math.cos(angle) * r;
              const y = 144 + Math.sin(angle) * r;
              return (
                <span
                  key={label}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-slate-950/90 px-2 py-1 text-[10px] font-semibold text-slate-200 shadow-lg"
                  style={{ left: x, top: y }}
                >
                  {label}
                </span>
              );
            })}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-teal-400/40 bg-teal-500/15 px-3 py-2 text-center">
              <p className="text-[10px] font-bold tracking-[0.2em] text-teal-100">
                TECHNOVA
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] bg-[#04070d] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Know the customer",
                body: "Clients and contacts live next to the work you sell them.",
                href: MARKETING_ROUTES.crm,
              },
              {
                title: "Run the project",
                body: "Tasks and milestones keep delivery visible to your team.",
                href: MARKETING_ROUTES.projectManagement,
              },
              {
                title: "Assign people",
                body: "Resources and time keep effort attached to the job.",
                href: MARKETING_ROUTES.resourceManagement,
              },
              {
                title: "Get paid",
                body: "Invoices and payments close the loop without a second system.",
                href: MARKETING_ROUTES.payments,
              },
            ].map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-teal-500/30"
              >
                <h3 className="font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{c.body}</p>
              </Link>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            <Link href={MARKETING_ROUTES.contact} className="text-sm text-teal-300 hover:text-teal-200">
              Contact →
            </Link>
            <Link href={MARKETING_ROUTES.solutions} className="text-sm text-slate-500 hover:text-slate-300">
              All solutions
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
