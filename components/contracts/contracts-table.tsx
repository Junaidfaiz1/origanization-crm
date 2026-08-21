import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedContract } from "@/modules/contracts/service";

const columns: DataTableColumn<SerializedContract>[] = [
  {
    id: "contract",
    header: "Contract",
    cell: (contract) => (
      <>
        <Link href={`/contracts/${contract.id}`} className="font-medium hover:underline">
          {contract.title}
        </Link>
        {contract.startDate ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Starts <DateDisplay value={contract.startDate} />
          </p>
        ) : null}
      </>
    ),
  },
  {
    id: "project",
    header: "Project",
    cell: (contract) => (
      <Link
        href={`/projects/${contract.projectId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {contract.project.name}
      </Link>
    ),
  },
  {
    id: "client",
    header: "Client",
    className: "text-muted-foreground",
    cell: (contract) => contract.client.name,
  },
  {
    id: "resource",
    header: "Resource",
    className: "text-muted-foreground",
    cell: (contract) => contract.resource?.name ?? "—",
  },
  {
    id: "amount",
    header: "Amount",
    cell: (contract) => (
      <MoneyDisplay amount={contract.totalAmount} currency={contract.currency} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (contract) => <StatusBadge status={contract.status} />,
  },
];

export function ContractsTable({ contracts }: { contracts: SerializedContract[] }) {
  return (
    <DataTable
      rows={contracts}
      columns={columns}
      rowKey={(contract) => contract.id}
      caption="Contracts"
      minWidthClassName="min-w-[52rem]"
      mobileRow={(contract) => (
        <Link
          href={`/contracts/${contract.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{contract.title}</p>
              <p className="truncate text-sm text-muted-foreground">{contract.project.name}</p>
            </div>
            <StatusBadge status={contract.status} />
          </div>
          <p className="mt-2 text-sm">
            <MoneyDisplay amount={contract.totalAmount} currency={contract.currency} />
            {" · "}
            {contract.client.name}
          </p>
        </Link>
      )}
    />
  );
}
