import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
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
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
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
    sort?: string;
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
    sort: params.sort,
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
      <PageHeader
        eyebrow="Finance"
        title="Invoices"
        description="Numbered invoices with line items, send workflow, and payment balance tracking."
        actions={
          canCreate ? (
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
          ) : undefined
        }
      />

      <InvoiceSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search invoice number, client, or project" />
        <InvoiceStatusFilter />
        <InvoiceClientFilter clients={clients} />
        <InvoiceProjectFilter projects={projects} />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
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
          <ResultCount count={result.totalCount} label="invoices" />
          <InvoicesTable invoices={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              clientId: params.clientId,
              projectId: params.projectId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
