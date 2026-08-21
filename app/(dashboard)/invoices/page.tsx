import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { invoiceListFilterSchema } from "@/modules/invoices/validation";
import {
  getInvoiceSummary,
  listInvoiceClientOptions,
  listInvoiceProjectOptions,
  listInvoices,
} from "@/modules/invoices/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import {
  InvoiceClientFilter,
  InvoiceProjectFilter,
  InvoiceStatusFilter,
  InvoiceSummaryCards,
} from "@/components/invoices/invoice-summary";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    clientId?: string;
    projectId?: string;
    cursor?: string;
  }>;
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

  const params = await searchParams;
  const filter = invoiceListFilterSchema.parse({
    search: params.q,
    status: params.status,
    clientId: params.clientId,
    projectId: params.projectId,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let clients;
  let projects;
  try {
    [result, summary, clients, projects] = await Promise.all([
      listInvoices(ctx, filter),
      getInvoiceSummary(ctx, params.projectId),
      listInvoiceClientOptions(ctx),
      listInvoiceProjectOptions(ctx, params.clientId),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to invoices"
          description="Ask a finance manager to grant INVOICE_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load invoices"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "INVOICE_CREATE");
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Finance</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Numbered invoices with line items, send workflow, and payment balance tracking.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link
              href={
                params.projectId
                  ? `/invoices/new?projectId=${params.projectId}`
                  : "/invoices/new"
              }
            >
              <Plus className="h-4 w-4" />
              New invoice
            </Link>
          </Button>
        ) : null}
      </div>

      <InvoiceSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search invoice number, client, or project" />
        <InvoiceStatusFilter />
        <InvoiceClientFilter clients={clients} />
        <InvoiceProjectFilter projects={projects} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/invoices" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create an invoice with line items, then send it to the client."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/invoices/new">Create invoice</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} invoices</p>
          <InvoicesTable invoices={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              clientId: params.clientId,
              projectId: params.projectId,
            }}
          />
        </>
      )}
    </div>
  );
}
