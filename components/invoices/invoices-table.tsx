import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedInvoice } from "@/modules/invoices/service";

export function InvoicesTable({ invoices }: { invoices: SerializedInvoice[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Project</th>
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
                    href={`/invoices/${invoice.id}`}
                    className="font-medium hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {invoice.client.companyName}
                </td>
                <td className="px-4 py-3">
                  {invoice.project ? (
                    <Link
                      href={`/projects/${invoice.project.id}`}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {invoice.project.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
        ))}
      </div>
    </>
  );
}
