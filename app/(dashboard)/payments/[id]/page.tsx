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
import { PaymentDetailActions } from "@/components/payments/payment-detail-actions";
import { getPayment } from "@/modules/payments/service";

export const metadata = { title: "Payment" };

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PAYMENT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to payments"
        description="Ask a finance manager to grant PAYMENT_VIEW."
      />
    );
  }

  const { id } = await params;

  let payment;
  try {
    payment = await getPayment(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState title="You cannot view this payment" description={error.message} />
      );
    }
    return (
      <ErrorState
        title="Could not load this payment"
        description="Check the database connection and try again."
      />
    );
  }

  const canVoid =
    hasPermission(ctx.permissions, "PAYMENT_UPDATE") && payment.status === "SUCCEEDED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/payments" className="text-sm text-muted-foreground hover:text-foreground">
            ← Payments
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              <MoneyDisplay amount={payment.amount} currency={payment.currency} />
            </h1>
            <StatusBadge status={payment.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/invoices/${payment.invoiceId}`}
              className="hover:text-foreground hover:underline"
            >
              {payment.invoice.invoiceNumber}
            </Link>
            {" · "}
            {payment.invoice.clientName}
          </p>
        </div>
        <PaymentDetailActions paymentId={payment.id} canVoid={canVoid} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount">
            <MoneyDisplay amount={payment.amount} currency={payment.currency} />
          </Field>
          <Field label="Status">
            <StatusBadge status={payment.status} />
          </Field>
          <Field label="Method">
            <span className="capitalize">
              {payment.method ? payment.method.replaceAll("_", " ").toLowerCase() : "—"}
            </span>
          </Field>
          <Field label="Provider">{payment.provider}</Field>
          <Field label="Paid">
            {payment.paidAt ? <DateDisplay value={payment.paidAt} /> : "—"}
          </Field>
          <Field label="Reference">{payment.providerPaymentId ?? "—"}</Field>
          <Field label="Invoice">
            <Link href={`/invoices/${payment.invoiceId}`} className="hover:underline">
              {payment.invoice.invoiceNumber}
            </Link>
          </Field>
          <Field label="Invoice status">
            <StatusBadge status={payment.invoice.status} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            {payment.notes ?? "—"}
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
