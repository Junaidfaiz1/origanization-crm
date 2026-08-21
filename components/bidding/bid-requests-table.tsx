import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedBidRequest } from "@/modules/bidding/service";

const columns: DataTableColumn<SerializedBidRequest>[] = [
  {
    id: "request",
    header: "Request",
    cell: (request) => (
      <>
        <Link
          href={`/bidding/requests/${request.id}`}
          className="font-medium hover:underline"
        >
          {request.title}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{request.biddingType}</p>
      </>
    ),
  },
  {
    id: "project",
    header: "Project",
    cell: (request) => (
      <Link
        href={`/projects/${request.projectId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {request.project.name}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (request) => <StatusBadge status={request.status} />,
  },
  {
    id: "budget",
    header: "Budget",
    className: "text-muted-foreground",
    cell: (request) => (
      <>
        <MoneyDisplay amount={request.budgetMin} />
        {" – "}
        <MoneyDisplay amount={request.budgetMax} />
      </>
    ),
  },
  {
    id: "bids",
    header: "Bids",
    cell: (request) => request.bidCount,
  },
  {
    id: "ends",
    header: "Ends",
    className: "text-muted-foreground",
    cell: (request) =>
      request.endsAt ? <DateDisplay value={request.endsAt} /> : "—",
  },
];

export function BidRequestsTable({ requests }: { requests: SerializedBidRequest[] }) {
  return (
    <DataTable
      rows={requests}
      columns={columns}
      rowKey={(request) => request.id}
      caption="Bid requests"
      minWidthClassName="min-w-[48rem]"
      mobileRow={(request) => (
        <Link
          href={`/bidding/requests/${request.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{request.title}</p>
              <p className="truncate text-sm text-muted-foreground">{request.project.name}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {request.bidCount} bids · <MoneyDisplay amount={request.budgetMin} />–
            <MoneyDisplay amount={request.budgetMax} />
          </p>
        </Link>
      )}
    />
  );
}
