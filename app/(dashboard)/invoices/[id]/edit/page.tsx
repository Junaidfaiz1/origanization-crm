import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import {
  getInvoice,
  listInvoiceClientOptions,
  listInvoiceProjectOptions,
} from "@/modules/invoices/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "INVOICE_CREATE")) {
    return (
      <ErrorState
        title="You cannot edit invoices"
        description="Ask a finance manager to grant INVOICE_CREATE."
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
    return (
      <ErrorState
        title="Could not load this invoice"
        description="Check the database connection and try again."
      />
    );
  }

  if (invoice.status !== "DRAFT") {
    return (
      <ErrorState
        title="This invoice cannot be edited"
        description="Only draft invoices can be updated."
      />
    );
  }

  const [clients, projects] = await Promise.all([
    listInvoiceClientOptions(ctx),
    listInvoiceProjectOptions(ctx),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/invoices/${invoice.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {invoice.invoiceNumber}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Edit invoice</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm invoice={invoice} clients={clients} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
