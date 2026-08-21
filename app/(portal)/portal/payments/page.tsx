import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/page";
import { listPortalPayments } from "@/modules/client-portal/service";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

export const metadata = { title: "Payments" };

export default async function PortalPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  const ctx = await requirePortalUser();
  const params = await searchParams;

  let payments;
  try {
    payments = await listPortalPayments(ctx);
  } catch {
    return <ErrorState title="Could not load payments" description="Try again shortly." />;
  }

  if (params.invoiceId) {
    payments = payments.filter((payment) => payment.invoiceId === params.invoiceId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payments recorded by the agency against your invoices.
        </p>
      </div>

      {payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="When the agency records a payment, it will show here."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/payments/${payment.id}`}
                        className="font-medium hover:underline"
                      >
                        {payment.paidAt ? <DateDisplay value={payment.paidAt} /> : "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/invoices/${payment.invoiceId}`}
                        className="text-muted-foreground hover:underline"
                      >
                        {payment.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">
                      {payment.method
                        ? payment.method.replaceAll("_", " ").toLowerCase()
                        : "—"}
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
                href={`/portal/payments/${payment.id}`}
                className="block rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate font-medium">{payment.invoiceNumber}</p>
                  <StatusBadge status={payment.status} />
                </div>
                <p className="mt-2 text-sm">
                  <MoneyDisplay amount={payment.amount} currency={payment.currency} />
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
