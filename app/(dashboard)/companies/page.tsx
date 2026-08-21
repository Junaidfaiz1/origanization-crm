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
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { CompaniesTable } from "@/components/companies/companies-table";

export const metadata = { title: "Companies" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; industry?: string; sort?: string; cursor?: string }>;
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
    sort: params.sort,
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
      <PageHeader
        eyebrow="CRM"
        title="Companies"
        description="Company records that sit behind clients, contacts, and deals."
        actions={
          canCreate ? (
            <Button asChild className="shrink-0">
              <Link href="/companies/new">
                <Plus className="h-4 w-4" />
                New company
              </Link>
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <SearchInput placeholder="Search name, industry, or location" />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
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
          <ResultCount count={result.totalCount} label="companies" />
          <CompaniesTable companies={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              industry: params.industry,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
