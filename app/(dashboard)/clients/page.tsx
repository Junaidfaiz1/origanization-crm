import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { clientListFilterSchema } from "@/modules/clients/validation";
import {
  listClients,
  listClientCompanyOptions,
} from "@/modules/clients/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ClientsTable } from "@/components/clients/clients-table";
import { CompanyFilter } from "@/components/contacts/company-filter";
import { ClientStatusFilter } from "@/components/clients/client-status-filter";

export const metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; companyId?: string; cursor?: string }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "CLIENT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to clients"
        description="Ask an owner or sales manager to grant CLIENT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = clientListFilterSchema.parse({
    search: params.q,
    status: params.status,
    companyId: params.companyId,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let companies;
  try {
    [result, companies] = await Promise.all([
      listClients(ctx, filter),
      listClientCompanyOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to clients"
          description="Ask an owner or sales manager to grant CLIENT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load clients"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "CLIENT_CREATE");
  const selectedCompany = companies.find((company) => company.id === params.companyId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">CRM</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active client accounts created from converted leads or direct onboarding.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link
              href={
                params.companyId
                  ? `/clients/new?companyId=${params.companyId}`
                  : "/clients/new"
              }
            >
              <Plus className="h-4 w-4" />
              New client
            </Link>
          </Button>
        ) : null}
      </div>

      <FilterBar>
        <SearchInput placeholder="Search company, contact, or notes" />
        <ClientStatusFilter />
        <CompanyFilter companies={companies} />
      </FilterBar>

      {selectedCompany ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/companies/${selectedCompany.id}`} className="font-medium hover:underline">
            {selectedCompany.name}
          </Link>
          {" · "}
          <Link href="/clients" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Convert a lead or create a client account for an existing company."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/clients/new">Create client</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} clients</p>
          <ClientsTable clients={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{ q: params.q, status: params.status, companyId: params.companyId }}
          />
        </>
      )}
    </div>
  );
}
