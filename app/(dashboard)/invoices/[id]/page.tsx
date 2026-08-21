import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EntityHeader } from "@/components/shared/entity-header";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <EntityHeader
        backHref="/invoices"
        backLabel="Invoices"
        title={invoice.invoiceNumber}
        status={invoice.status}
        description={invoice.client.companyName}
        actions={
          <InvoiceDetailActions
            invoiceId={invoice.id}
            canEdit={canEdit}
            canSend={canSend}
            canCancel={canCancel}
            canMarkOverdue={canMarkOverdue}
            canDelete={canDelete}
            canRecordPayment={canRecordPayment}
          />
        }
      />

      <article className="rounded-lg border border-border bg-card p-5 shadow-xs sm:p-8 print:border-0 print:shadow-none">
        <div className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-tight">TechNova</p>
            <p className="mt-1 text-caption text-muted-foreground">
              {ctx.user.organization.name}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-h3">{invoice.invoiceNumber}</p>
            <p className="mt-1 text-caption text-muted-foreground">
              Status {invoice.status.replaceAll("_", " ").toLowerCase()}
            </p>
          </div>
        </div>

        <div className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              Bill to
            </p>
            <p className="mt-2 text-sm font-medium">{invoice.client.companyName}</p>
            {invoice.project ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Project:{" "}
                <Link
                  href={`/projects/${invoice.project.id}`}
                  className="hover:underline"
                >
                  {invoice.project.name}
                </Link>
              </p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:justify-items-end">
            <div>
              <p className="text-caption text-muted-foreground">Issue date</p>
              <p className="mt-1 font-medium">
                <DateDisplay value={invoice.issueDate} />
              </p>
            </div>
            <div>
              <p className="text-caption text-muted-foreground">Due date</p>
              <p className="mt-1 font-medium">
                {invoice.dueDate ? <DateDisplay value={invoice.dueDate} /> : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto py-6">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-caption text-muted-foreground">
                <th className="pb-2 font-medium">Description</th>
                <th className="pb-2 font-medium">Qty</th>
                <th className="pb-2 font-medium">Rate</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-3">{item.description}</td>
                  <td className="py-3 pr-3">{item.quantity}</td>
                  <td className="py-3 pr-3">
                    <MoneyDisplay
                      amount={item.unitPrice}
                      currency={invoice.currency}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <MoneyDisplay amount={item.total} currency={invoice.currency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto max-w-xs space-y-2 border-t border-border pt-4 text-sm">
          <Row
            label="Subtotal"
            value={
              <MoneyDisplay amount={invoice.subtotal} currency={invoice.currency} />
            }
          />
          <Row
            label="Discount"
            value={
              <MoneyDisplay amount={invoice.discount} currency={invoice.currency} />
            }
          />
          <Row
            label="Tax"
            value={
              <MoneyDisplay amount={invoice.tax} currency={invoice.currency} />
            }
          />
          <Row
            label="Total"
            value={
              <MoneyDisplay amount={invoice.total} currency={invoice.currency} />
            }
            strong
          />
          <Row
            label="Paid"
            value={
              <MoneyDisplay
                amount={invoice.amountPaid}
                currency={invoice.currency}
              />
            }
          />
          <Row
            label="Amount due"
            value={
              <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
            }
            strong
          />
        </div>

        {invoice.notes ? (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-caption text-muted-foreground">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{invoice.notes}</p>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">Payments</span>
          <Link
            href={`/payments?invoiceId=${invoice.id}`}
            className="font-medium text-primary hover:underline"
          >
            {invoice.paymentCount} recorded
          </Link>
        </div>
      </article>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-6 ${strong ? "border-t border-border pt-2 font-semibold" : ""}`}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
