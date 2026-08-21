import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedPayment } from "@/modules/payments/service";

function methodLabel(method: string | null) {
  if (!method) return "—";
  return method.replaceAll("_", " ").toLowerCase();
}

export function PaymentsTable({ payments }: { payments: SerializedPayment[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/payments/${payment.id}`} className="font-medium hover:underline">
                    {payment.paidAt ? <DateDisplay value={payment.paidAt} /> : "—"}
                  </Link>
                  {payment.providerPaymentId ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ref {payment.providerPaymentId}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/${payment.invoiceId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {payment.invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.invoice.clientName}
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">
                  {methodLabel(payment.method)}
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={payment.amount} currency={payment.currency} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {payments.map((payment) => (
          <Link
            key={payment.id}
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
        ))}
      </div>
    </>
  );
}
