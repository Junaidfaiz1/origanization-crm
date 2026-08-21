import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedLead } from "@/modules/leads/service";

const columns: DataTableColumn<SerializedLead>[] = [
  {
    id: "name",
    header: "Name",
    cell: (lead) => (
      <>
        <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
          {lead.name}
        </Link>
        {lead.email ? (
          <p className="text-xs text-muted-foreground">{lead.email}</p>
        ) : null}
      </>
    ),
  },
  {
    id: "company",
    header: "Company",
    className: "text-muted-foreground",
    cell: (lead) => lead.companyName ?? "—",
  },
  {
    id: "status",
    header: "Status",
    cell: (lead) => <StatusBadge status={lead.status} />,
  },
  {
    id: "value",
    header: "Value",
    cell: (lead) => <MoneyDisplay amount={lead.estimatedValue} />,
  },
  {
    id: "owner",
    header: "Owner",
    className: "text-muted-foreground",
    cell: (lead) => lead.assignedTo?.name ?? "Unassigned",
  },
  {
    id: "created",
    header: "Created",
    className: "text-muted-foreground",
    cell: (lead) => <DateDisplay value={lead.createdAt} />,
  },
];

export function LeadsTable({ leads }: { leads: SerializedLead[] }) {
  return (
    <DataTable
      rows={leads}
      columns={columns}
      rowKey={(lead) => lead.id}
      caption="Leads"
      mobileRow={(lead) => (
        <Link
          href={`/leads/${lead.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{lead.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {lead.companyName ?? lead.email ?? "No company"}
              </p>
            </div>
            <StatusBadge status={lead.status} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <MoneyDisplay amount={lead.estimatedValue} />
            <span>{lead.assignedTo?.name ?? "Unassigned"}</span>
          </div>
        </Link>
      )}
    />
  );
}
