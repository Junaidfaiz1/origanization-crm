import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortalUser } from "@/lib/auth/page";
import { NotFoundError } from "@/lib/errors/app-error";
import { getPortalPayment } from "@/modules/client-portal/service";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Payment" };

export default async function PortalPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePortalUser();
  const { id } = await params;

  let payment;
  try {
    payment = await getPortalPayment(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    return <ErrorState title="Could not load payment" description="Try again shortly." />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/portal/payments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Payments
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            <MoneyDisplay amount={payment.amount} currency={payment.currency} />
          </h1>
          <StatusBadge status={payment.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
          <Field label="Invoice">
            <Link href={`/portal/invoices/${payment.invoiceId}`} className="hover:underline">
              {payment.invoiceNumber}
            </Link>
          </Field>
          <Field label="Status">
            <StatusBadge status={payment.status} />
          </Field>
          <Field label="Paid">
            {payment.paidAt ? <DateDisplay value={payment.paidAt} /> : "—"}
          </Field>
          <Field label="Method">
            <span className="capitalize">
              {payment.method
                ? payment.method.replaceAll("_", " ").toLowerCase()
                : "—"}
            </span>
          </Field>
          <Field label="Reference">{payment.reference ?? "—"}</Field>
          <Field label="Provider">{payment.provider}</Field>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}
