import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceDetailActions } from "@/components/invoices/invoice-detail-actions";
import { getInvoice } from "@/modules/invoices/service";

export const metadata = { title: "Invoice" };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "INVOICE_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to invoices"
        description="Ask a finance manager to grant INVOICE_VIEW."
      />
    );
  }

  const { id } = await params;

  let invoice;
  try {
    invoice = await getInvoice(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState title="You cannot view this invoice" description={error.message} />
      );
    }
    return (
      <ErrorState
        title="Could not load this invoice"
        description="Check the database connection and try again."
      />
    );
  }

  const amountPaid = Number(invoice.amountPaid);
  const canEdit =
    hasPermission(ctx.permissions, "INVOICE_CREATE") && invoice.status === "DRAFT";
  const canSend =
    hasPermission(ctx.permissions, "INVOICE_SEND") &&
    invoice.status === "DRAFT" &&
    invoice.items.length > 0;
  const canCancel =
    hasPermission(ctx.permissions, "INVOICE_UPDATE") &&
    !["CANCELLED", "PAID"].includes(invoice.status) &&
    amountPaid === 0;
  const canMarkOverdue =
    hasPermission(ctx.permissions, "INVOICE_UPDATE") &&
    ["SENT", "PARTIALLY_PAID"].includes(invoice.status) &&
    !!invoice.dueDate &&
    new Date(invoice.dueDate) < new Date();
  const canDelete =
    hasPermission(ctx.permissions, "INVOICE_CREATE") &&
    invoice.status === "DRAFT" &&
    amountPaid === 0;
  const canRecordPayment =
    hasPermission(ctx.permissions, "PAYMENT_CREATE") &&
    ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status) &&
    Number(invoice.amountDue) > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
            ← Invoices
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoice.client.companyName}
            {invoice.project ? (
              <>
                {" · "}
                <Link
                  href={`/projects/${invoice.project.id}`}
                  className="hover:text-foreground hover:underline"
                >
                  {invoice.project.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <InvoiceDetailActions
          invoiceId={invoice.id}
          canEdit={canEdit}
          canSend={canSend}
          canCancel={canCancel}
          canMarkOverdue={canMarkOverdue}
          canDelete={canDelete}
          canRecordPayment={canRecordPayment}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{invoice.notes}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <MoneyDisplay amount={invoice.subtotal} currency={invoice.currency} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <MoneyDisplay amount={invoice.discount} currency={invoice.currency} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <MoneyDisplay amount={invoice.tax} currency={invoice.currency} />
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-semibold">
              <span>Total</span>
              <MoneyDisplay amount={invoice.total} currency={invoice.currency} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid</span>
              <MoneyDisplay amount={invoice.amountPaid} currency={invoice.currency} />
            </div>
            <div className="flex justify-between font-medium">
              <span>Amount due</span>
              <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued</span>
                <DateDisplay value={invoice.issueDate} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due</span>
                {invoice.dueDate ? <DateDisplay value={invoice.dueDate} /> : "—"}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payments</span>
                <Link
                  href={`/payments?invoiceId=${invoice.id}`}
                  className="font-medium hover:underline"
                >
                  {invoice.paymentCount}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
