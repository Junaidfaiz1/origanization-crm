import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedInvoice } from "@/modules/invoices/service";

const columns: DataTableColumn<SerializedInvoice>[] = [
  {
    id: "invoice",
    header: "Invoice",
    cell: (invoice) => (
      <Link href={`/invoices/${invoice.id}`} className="font-medium hover:underline">
        {invoice.invoiceNumber}
      </Link>
    ),
  },
  {
    id: "client",
    header: "Client",
    className: "text-muted-foreground",
    cell: (invoice) => invoice.client.companyName,
  },
  {
    id: "project",
    header: "Project",
    cell: (invoice) =>
      invoice.project ? (
        <Link
          href={`/projects/${invoice.project.id}`}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {invoice.project.name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "issued",
    header: "Issued",
    cell: (invoice) => <DateDisplay value={invoice.issueDate} />,
  },
  {
    id: "total",
    header: "Total",
    cell: (invoice) => (
      <MoneyDisplay amount={invoice.total} currency={invoice.currency} />
    ),
  },
  {
    id: "due",
    header: "Due",
    cell: (invoice) => (
      <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (invoice) => <StatusBadge status={invoice.status} />,
  },
];

export function InvoicesTable({ invoices }: { invoices: SerializedInvoice[] }) {
  return (
    <DataTable
      rows={invoices}
      columns={columns}
      rowKey={(invoice) => invoice.id}
      caption="Invoices"
      minWidthClassName="min-w-[56rem]"
      mobileRow={(invoice) => (
        <Link
          href={`/invoices/${invoice.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{invoice.invoiceNumber}</p>
              <p className="truncate text-sm text-muted-foreground">
                {invoice.client.companyName}
              </p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-2 text-sm">
            <MoneyDisplay amount={invoice.total} currency={invoice.currency} />
            {" · due "}
            <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
          </p>
        </Link>
      )}
    />
  );
}
