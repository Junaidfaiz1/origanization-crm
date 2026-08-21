import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { companyListFilterSchema } from "@/modules/companies/validation";
import { listCompanies } from "@/modules/companies/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { CompaniesTable } from "@/components/companies/companies-table";

export const metadata = { title: "Companies" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; industry?: string; cursor?: string }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "COMPANY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to companies"
        description="Ask an owner or admin to grant COMPANY_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = companyListFilterSchema.parse({
    search: params.q,
    industry: params.industry,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  try {
    result = await listCompanies(ctx, filter);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to companies"
          description="Ask an owner or admin to grant COMPANY_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load companies"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "COMPANY_CREATE");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">CRM</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Company records that sit behind clients, contacts, and deals.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link href="/companies/new">
              <Plus className="h-4 w-4" />
              New company
            </Link>
          </Button>
        ) : null}
      </div>

      <FilterBar>
        <SearchInput placeholder="Search name, industry, or location" />
      </FilterBar>

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No companies yet"
          description="Add a company to organize contacts and clients."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/companies/new">Create company</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} companies</p>
          <CompaniesTable companies={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{ q: params.q, industry: params.industry }}
          />
        </>
      )}
    </div>
  );
}
