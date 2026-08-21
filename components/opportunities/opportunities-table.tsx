import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedOpportunity } from "@/modules/opportunities/service";

const columns: DataTableColumn<SerializedOpportunity>[] = [
  {
    id: "deal",
    header: "Deal",
    cell: (opportunity) => (
      <>
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="font-medium hover:underline"
        >
          {opportunity.name}
        </Link>
        {opportunity.assignedTo ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {opportunity.assignedTo.name}
          </p>
        ) : null}
      </>
    ),
  },
  {
    id: "client",
    header: "Client",
    cell: (opportunity) => (
      <Link
        href={`/clients/${opportunity.clientId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {opportunity.client.companyName}
      </Link>
    ),
  },
  {
    id: "stage",
    header: "Stage",
    cell: (opportunity) => <StatusBadge status={opportunity.stage} />,
  },
  {
    id: "value",
    header: "Value",
    cell: (opportunity) => <MoneyDisplay amount={opportunity.estimatedValue} />,
  },
  {
    id: "weighted",
    header: "Weighted",
    className: "text-muted-foreground",
    cell: (opportunity) => (
      <>
        <MoneyDisplay amount={opportunity.weightedValue} />
        <span className="ml-1 text-xs">({opportunity.probability}%)</span>
      </>
    ),
  },
  {
    id: "close",
    header: "Close",
    className: "text-muted-foreground",
    cell: (opportunity) =>
      opportunity.expectedCloseDate ? (
        <DateDisplay value={opportunity.expectedCloseDate} />
      ) : (
        "—"
      ),
  },
];

export function OpportunitiesTable({
  opportunities,
}: {
  opportunities: SerializedOpportunity[];
}) {
  return (
    <DataTable
      rows={opportunities}
      columns={columns}
      rowKey={(opportunity) => opportunity.id}
      caption="Opportunities"
      minWidthClassName="min-w-[48rem]"
      mobileRow={(opportunity) => (
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{opportunity.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {opportunity.client.companyName}
              </p>
            </div>
            <StatusBadge status={opportunity.stage} />
          </div>
          <p className="mt-2 text-sm">
            <MoneyDisplay amount={opportunity.estimatedValue} /> ·{" "}
            {opportunity.probability}% weighted
          </p>
        </Link>
      )}
    />
  );
}
