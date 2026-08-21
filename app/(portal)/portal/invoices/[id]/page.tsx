import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortalUser } from "@/lib/auth/page";
import { NotFoundError } from "@/lib/errors/app-error";
import { getPortalInvoice } from "@/modules/client-portal/service";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Invoice" };

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePortalUser();
  const { id } = await params;

  let invoice;
  try {
    invoice = await getPortalInvoice(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    return <ErrorState title="Could not load invoice" description="Try again shortly." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/portal/invoices"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Invoices
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {invoice.invoiceNumber}
          </h1>
          <StatusBadge status={invoice.status} />
        </div>
        {invoice.projectName ? (
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/portal/projects/${invoice.projectId}`}
              className="hover:underline"
            >
              {invoice.projectName}
            </Link>
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Unit</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">
                        <MoneyDisplay amount={item.unitPrice} currency={invoice.currency} />
                      </td>
                      <td className="px-3 py-2">
                        <MoneyDisplay amount={item.total} currency={invoice.currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invoice.notes ? (
              <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
                {invoice.notes}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <MoneyDisplay amount={invoice.total} currency={invoice.currency} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <MoneyDisplay amount={invoice.amountPaid} currency={invoice.currency} />
            </div>
            <div className="flex justify-between font-semibold">
              <span>Amount due</span>
              <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
            </div>
            <div className="flex justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">Issued</span>
              <DateDisplay value={invoice.issueDate} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due date</span>
              {invoice.dueDate ? <DateDisplay value={invoice.dueDate} /> : "—"}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payments</span>
              <Link
                href={`/portal/payments?invoiceId=${invoice.id}`}
                className="font-medium hover:underline"
              >
                {invoice.paymentCount}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
