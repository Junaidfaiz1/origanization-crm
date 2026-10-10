import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Time tracking",
  description:
    "Track effort against projects and connect time to cost and profitability in TechNova.",
  path: MARKETING_ROUTES.timeTracking,
});

function TimeVisual() {
  const bars = [40, 65, 30, 80, 55, 45, 70];
  return (
    <div className="relative flex min-h-[16rem] flex-col justify-center overflow-hidden rounded-3xl border border-[var(--mk-line)] bg-gradient-to-br from-cyan-950/40 via-slate-950 to-slate-950 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-cyan-300/80">
        Week · project effort
      </p>
      <div className="mt-6 flex h-28 items-end gap-2">
        {bars.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-cyan-700/80 to-cyan-300/90"
              style={{ height: `${h}%` }}
            />
            <span className="text-[11px] text-slate-600">D{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-400">
        <span className="rounded-md border border-[var(--mk-line)] px-2 py-1">Time</span>
        <span className="text-cyan-500">→</span>
        <span className="rounded-md border border-[var(--mk-line)] px-2 py-1">Project</span>
        <span className="text-cyan-500">→</span>
        <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-cyan-100">
          Cost
        </span>
      </div>
    </div>
  );
}

export default function TimeTrackingProductPage() {
  return (
    <ProductLandingPage
      eyebrow="Time tracking"
      title={
        <>
          Know where{" "}
          <span className="mt-2 block text-slate-300">your time goes.</span>
        </>
      }
      lead="Log effort against projects so team cost can inform delivery decisions and profitability — not just a timesheet for timesheet’s sake."
      metaphor="Effort → cost"
      secondaryCta={{ href: MARKETING_ROUTES.profitability, label: "Profitability" }}
      problem={{
        title: "Hours without a home",
        body: "Time in a separate app never reaches project cost. Finance invents numbers after the fact.",
      }}
      solution={{
        title: "Time attached to projects",
        body: "TechNova time entries live next to projects and resources so effort can flow into cost views.",
      }}
      workflow={["Log time", "Project", "Resource cost", "Profitability"]}
      features={[
        {
          title: "Project-linked entries",
          body: "Track against the work that was sold and staffed.",
        },
        {
          title: "Team & freelancer time",
          body: "Collaborators can log time from surfaces they are allowed to use.",
        },
        {
          title: "Cost signal",
          body: "Time contributes to understanding real project cost alongside expenses and fees.",
        },
        {
          title: "Permission aware",
          body: "Who can view or edit time is controlled with the rest of the workspace.",
        },
      ]}
      uiTitle="technova · time"
      uiItems={["Time entries", "Project filter", "Resource link", "Weekly view"]}
      faq={[
        {
          q: "Is this a payroll product?",
          a: "No. TechNova focuses on project effort and cost context — not full payroll processing.",
        },
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.resourceManagement, label: "Resources" },
        { href: MARKETING_ROUTES.profitability, label: "Profitability" },
        { href: MARKETING_ROUTES.projectManagement, label: "Projects" },
      ]}
      visual={<TimeVisual />}
    />
  );
}
