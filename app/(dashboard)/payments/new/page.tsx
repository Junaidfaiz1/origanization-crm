import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { PaymentForm } from "@/components/payments/payment-form";
import { listPaymentInvoiceOptions } from "@/modules/payments/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Record payment" };

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ invoiceId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PAYMENT_CREATE")) {
    return (
      <ErrorState
        title="You cannot record payments"
        description="Ask a finance manager to grant PAYMENT_CREATE."
      />
    );
  }

  const params = await searchParams;
  const invoices = await listPaymentInvoiceOptions(ctx);

  if (invoices.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="No payable invoices"
          description="Send an invoice first. Only sent, partially paid, or overdue invoices with a balance can receive payments."
        />
        <p className="text-center text-sm">
          <Link href="/invoices" className="font-medium hover:underline">
            View invoices
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/payments" className="text-sm text-muted-foreground hover:text-foreground">
          ← Payments
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Record payment
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use this when payment already happened outside the CRM (bank, cash, cheque).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment details</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentForm invoices={invoices} defaultInvoiceId={params.invoiceId} />
        </CardContent>
      </Card>
    </div>
  );
}
