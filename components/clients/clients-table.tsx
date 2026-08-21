import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedClient } from "@/modules/clients/service";

const columns: DataTableColumn<SerializedClient>[] = [
  {
    id: "company",
    header: "Company",
    cell: (client) => (
      <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
        {client.company.name}
      </Link>
    ),
  },
  {
    id: "primaryContact",
    header: "Primary contact",
    className: "text-muted-foreground",
    cell: (client) =>
      client.primaryContact ? (
        <Link
          href={`/contacts/${client.primaryContact.id}`}
          className="hover:text-foreground hover:underline"
        >
          {client.primaryContact.name}
        </Link>
      ) : (
        "—"
      ),
  },
  {
    id: "status",
    header: "Status",
    cell: (client) => <StatusBadge status={client.status} />,
  },
  {
    id: "opportunities",
    header: "Opportunities",
    cell: (client) => client.opportunityCount,
  },
  {
    id: "projects",
    header: "Projects",
    cell: (client) => client.projectCount,
  },
  {
    id: "created",
    header: "Created",
    className: "text-muted-foreground",
    cell: (client) => <DateDisplay value={client.createdAt} />,
  },
];

export function ClientsTable({ clients }: { clients: SerializedClient[] }) {
  return (
    <DataTable
      rows={clients}
      columns={columns}
      rowKey={(client) => client.id}
      caption="Clients"
      minWidthClassName="min-w-[44rem]"
      mobileRow={(client) => (
        <Link
          href={`/clients/${client.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{client.company.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {client.primaryContact?.name ?? "No primary contact"}
              </p>
            </div>
            <StatusBadge status={client.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {client.opportunityCount} opportunities · {client.projectCount} projects
          </p>
        </Link>
      )}
    />
  );
}
