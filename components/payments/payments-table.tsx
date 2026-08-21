import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedPayment } from "@/modules/payments/service";

function methodLabel(method: string | null) {
  if (!method) return "—";
  return method.replaceAll("_", " ").toLowerCase();
}

const columns: DataTableColumn<SerializedPayment>[] = [
  {
    id: "paid",
    header: "Paid",
    cell: (payment) => (
      <>
        <Link href={`/payments/${payment.id}`} className="font-medium hover:underline">
          {payment.paidAt ? <DateDisplay value={payment.paidAt} /> : "—"}
        </Link>
        {payment.providerPaymentId ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Ref {payment.providerPaymentId}
          </p>
        ) : null}
      </>
    ),
  },
  {
    id: "invoice",
    header: "Invoice",
    cell: (payment) => (
      <Link
        href={`/invoices/${payment.invoiceId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {payment.invoice.invoiceNumber}
      </Link>
    ),
  },
  {
    id: "client",
    header: "Client",
    className: "text-muted-foreground",
    cell: (payment) => payment.invoice.clientName,
  },
  {
    id: "method",
    header: "Method",
    className: "capitalize text-muted-foreground",
    cell: (payment) => methodLabel(payment.method),
  },
  {
    id: "amount",
    header: "Amount",
    cell: (payment) => (
      <MoneyDisplay amount={payment.amount} currency={payment.currency} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (payment) => <StatusBadge status={payment.status} />,
  },
];

export function PaymentsTable({ payments }: { payments: SerializedPayment[] }) {
  return (
    <DataTable
      rows={payments}
      columns={columns}
      rowKey={(payment) => payment.id}
      caption="Payments"
      minWidthClassName="min-w-[52rem]"
      mobileRow={(payment) => (
        <Link
          href={`/payments/${payment.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{payment.invoice.invoiceNumber}</p>
              <p className="truncate text-sm text-muted-foreground">
                {payment.invoice.clientName}
              </p>
            </div>
            <StatusBadge status={payment.status} />
          </div>
          <p className="mt-2 text-sm">
            <MoneyDisplay amount={payment.amount} currency={payment.currency} />
            {" · "}
            <span className="capitalize">{methodLabel(payment.method)}</span>
          </p>
        </Link>
      )}
    />
  );
}
