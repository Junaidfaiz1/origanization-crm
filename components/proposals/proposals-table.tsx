import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedProposal } from "@/modules/proposals/service";

const columns: DataTableColumn<SerializedProposal>[] = [
  {
    id: "proposal",
    header: "Proposal",
    cell: (proposal) => (
      <>
        <Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">
          {proposal.title}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{proposal.opportunity.name}</p>
      </>
    ),
  },
  {
    id: "client",
    header: "Client",
    cell: (proposal) => (
      <Link
        href={`/clients/${proposal.clientId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {proposal.client.companyName}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (proposal) => <StatusBadge status={proposal.status} />,
  },
  {
    id: "total",
    header: "Total",
    cell: (proposal) => (
      <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
    ),
  },
  {
    id: "validUntil",
    header: "Valid until",
    className: "text-muted-foreground",
    cell: (proposal) => <DateDisplay value={proposal.validUntil} />,
  },
  {
    id: "updated",
    header: "Updated",
    className: "text-muted-foreground",
    cell: (proposal) => <DateDisplay value={proposal.updatedAt} />,
  },
];

export function ProposalsTable({ proposals }: { proposals: SerializedProposal[] }) {
  return (
    <DataTable
      rows={proposals}
      columns={columns}
      rowKey={(proposal) => proposal.id}
      caption="Proposals"
      minWidthClassName="min-w-[56rem]"
      mobileRow={(proposal) => (
        <Link
          href={`/proposals/${proposal.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{proposal.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {proposal.client.companyName}
              </p>
            </div>
            <StatusBadge status={proposal.status} />
          </div>
          <p className="mt-2 text-sm">
            <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
          </p>
        </Link>
      )}
    />
  );
}
