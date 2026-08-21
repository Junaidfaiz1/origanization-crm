import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/page";
import { listPortalInvoices } from "@/modules/client-portal/service";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

export const metadata = { title: "Invoices" };

export default async function PortalInvoicesPage() {
  const ctx = await requirePortalUser();

  let invoices;
  try {
    invoices = await listPortalInvoices(ctx);
  } catch {
    return <ErrorState title="Could not load invoices" description="Try again shortly." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Invoices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review sent invoices and remaining balances.
        </p>
      </div>

      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" description="Sent invoices will appear here." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/invoices/${invoice.id}`}
                        className="font-medium hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <DateDisplay value={invoice.issueDate} />
                    </td>
                    <td className="px-4 py-3">
                      <MoneyDisplay amount={invoice.total} currency={invoice.currency} />
                    </td>
                    <td className="px-4 py-3">
                      <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/portal/invoices/${invoice.id}`}
                className="block rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate font-medium">{invoice.invoiceNumber}</p>
                  <StatusBadge status={invoice.status} />
                </div>
                <p className="mt-2 text-sm">
                  Due <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
