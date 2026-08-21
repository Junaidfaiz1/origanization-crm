import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import {
  listInvoiceClientOptions,
  listInvoiceProjectOptions,
} from "@/modules/invoices/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; clientId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "INVOICE_CREATE")) {
    return (
      <ErrorState
        title="You cannot create invoices"
        description="Ask a finance manager to grant INVOICE_CREATE."
      />
    );
  }

  const params = await searchParams;
  const [clients, projects] = await Promise.all([
    listInvoiceClientOptions(ctx),
    listInvoiceProjectOptions(ctx),
  ]);

  if (clients.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="No clients available"
          description="Invoices must be linked to a client."
        />
        <p className="text-center text-sm">
          <Link href="/clients" className="font-medium hover:underline">
            View clients
          </Link>
        </p>
      </div>
    );
  }

  const defaultProject = params.projectId
    ? projects.find((project) => project.id === params.projectId)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
          ← Invoices
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">New invoice</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceForm
            clients={clients}
            projects={projects}
            defaultClientId={params.clientId ?? defaultProject?.clientId}
            defaultProjectId={params.projectId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
