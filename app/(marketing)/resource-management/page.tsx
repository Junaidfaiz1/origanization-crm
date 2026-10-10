import { ProductLandingPage } from "@/components/marketing/product-landing";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Resource management",
  description:
    "People, skills, rates, availability, and assignments for agency and service teams in TechNova.",
  path: MARKETING_ROUTES.resourceManagement,
});

function ResourceVisual() {
  return (
    <div className="relative flex min-h-[16rem] flex-col justify-center gap-3 overflow-hidden rounded-3xl border border-[var(--mk-line)] bg-gradient-to-br from-violet-950/35 via-slate-950 to-slate-950 p-6">
      {[
        { name: "Employee", skill: "Full-stack", load: "72%" },
        { name: "Freelancer", skill: "Design", load: "Assigned" },
        { name: "Employee", skill: "PM", load: "48%" },
      ].map((row) => (
        <div
          key={`${row.name}-${row.skill}`}
          className="flex items-center gap-3 rounded-xl border border-[var(--mk-line)] bg-[var(--mk-tint)] px-3 py-2.5"
        >
          <span className="h-8 w-8 shrink-0 rounded-full bg-violet-500/20 ring-1 ring-violet-400/30" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200">{row.name}</p>
            <p className="text-[11px] text-slate-500">{row.skill}</p>
          </div>
          <span className="rounded-md border border-[var(--mk-line)] px-2 py-1 text-[11px] text-slate-400">
            {row.load}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ResourceManagementPage() {
  return (
    <ProductLandingPage
      eyebrow="Resources"
      title={
        <>
          Know who is working{" "}
          <span className="mt-2 block text-slate-300">on what.</span>
        </>
      }
      lead="Employees and freelancers, skills and rates, availability and assignments — so staffing decisions sit next to the project."
      metaphor="People · skills · assignment"
      secondaryCta={{ href: MARKETING_ROUTES.bidding, label: "Bidding" }}
      problem={{
        title: "Capacity lives in someone’s head",
        body: "When rates and availability sit in spreadsheets, project managers guess — and finance cannot reconcile cost later.",
      }}
      solution={{
        title: "Resources as first-class records",
        body: "TechNova tracks people, skills, rates, and assignments so delivery and cost share the same source of truth.",
      }}
      workflow={["People", "Skills", "Rates", "Availability", "Assign"]}
      features={[
        {
          title: "Employees & freelancers",
          body: "Model both internal and external capacity in the same resource layer.",
        },
        {
          title: "Skills and rates",
          body: "Capture what people can do and what they cost — used carefully behind permission boundaries.",
        },
        {
          title: "Assignments on projects",
          body: "After award or internal staffing, keep assignment attached to the project.",
        },
        {
          title: "Feeds time & profit",
          body: "Resource cost is an input to time tracking and profitability views.",
        },
      ]}
      uiTitle="technova · resources"
      uiItems={["Resource directory", "Skills", "Rates", "Assignments"]}
      useCases={[
        {
          title: "Bench visibility",
          body: "See who is available before you open a bid request.",
        },
        {
          title: "Rate discipline",
          body: "Keep cost context for finance without exposing it in client portals.",
        },
      ]}
      nextLinks={[
        { href: MARKETING_ROUTES.timeTracking, label: "Time tracking" },
        { href: MARKETING_ROUTES.bidding, label: "Bidding" },
        { href: MARKETING_ROUTES.profitability, label: "Profitability" },
      ]}
      visual={<ResourceVisual />}
    />
  );
}
