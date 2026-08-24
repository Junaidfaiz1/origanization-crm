"use client";

type PanelKind = "crm" | "sales" | "projects" | "bidding" | "finance" | "clients";

const PANELS: Record<
  PanelKind,
  { title: string; rows: Array<{ label: string; value: string }> }
> = {
  crm: {
    title: "CRM",
    rows: [
      { label: "Leads", value: "124" },
      { label: "Opportunities", value: "38" },
      { label: "Pipeline", value: "$84,200" },
    ],
  },
  sales: {
    title: "Sales pipeline",
    rows: [
      { label: "Qualified", value: "12" },
      { label: "Proposal", value: "7" },
      { label: "Win rate", value: "41%" },
    ],
  },
  projects: {
    title: "Website Redesign",
    rows: [
      { label: "Progress", value: "82%" },
      { label: "Tasks", value: "24 / 32" },
      { label: "Health", value: "On track" },
    ],
  },
  bidding: {
    title: "Bid request",
    rows: [
      { label: "Status", value: "Open" },
      { label: "Bids", value: "6" },
      { label: "Deadline", value: "12 days" },
    ],
  },
  finance: {
    title: "Revenue",
    rows: [
      { label: "MTD", value: "$124,500" },
      { label: "Outstanding", value: "$32,400" },
      { label: "Margin", value: "28%" },
    ],
  },
  clients: {
    title: "Client portal",
    rows: [
      { label: "Projects", value: "3 active" },
      { label: "Invoices", value: "2 due" },
      { label: "Progress", value: "Shared" },
    ],
  },
};

export function ProductWindowUi({ kind }: { kind: PanelKind }) {
  const panel = PANELS[kind];
  return (
    <div className="w-[220px] select-none rounded-lg border border-white/15 bg-[#0b1220]/95 p-3 text-left shadow-lg backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wide text-teal-300">
          {panel.title}
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400/80" />
      </div>
      <div className="space-y-1.5">
        {panel.rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 text-[11px]"
          >
            <span className="text-slate-400">{row.label}</span>
            <span className="font-medium text-slate-100">{row.value}</span>
          </div>
        ))}
      </div>
      {kind === "projects" ? (
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-[82%] rounded-full bg-teal-400" />
        </div>
      ) : null}
      {kind === "finance" ? (
        <svg
          viewBox="0 0 120 28"
          className="mt-2.5 h-7 w-full text-teal-400/80"
          aria-hidden
        >
          <path
            d="M2 22 C 20 20, 28 8, 45 12 S 70 24, 90 10 S 110 6, 118 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
    </div>
  );
}
