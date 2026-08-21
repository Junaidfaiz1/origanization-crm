import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { opportunityListFilterSchema } from "@/modules/opportunities/validation";
import {
  getOpportunityPipelineSummary,
  listOpportunities,
  listOpportunityClientOptions,
} from "@/modules/opportunities/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { OpportunitiesTable } from "@/components/opportunities/opportunities-table";
import {
  OpportunityPipelineSummary,
  OpportunityStageFilter,
} from "@/components/opportunities/opportunity-pipeline-summary";
import { OpportunityClientFilter } from "@/components/opportunities/opportunity-client-filter";

export const metadata = { title: "Opportunities" };

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    clientId?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "OPPORTUNITY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to opportunities"
        description="Ask an owner or sales manager to grant OPPORTUNITY_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = opportunityListFilterSchema.parse({
    search: params.q,
    stage: params.stage,
    clientId: params.clientId,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let clients;
  try {
    [result, summary, clients] = await Promise.all([
      listOpportunities(ctx, filter),
      getOpportunityPipelineSummary(ctx),
      listOpportunityClientOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to opportunities"
          description="Ask an owner or sales manager to grant OPPORTUNITY_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load opportunities"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "OPPORTUNITY_CREATE");
  const selectedClient = clients.find((client) => client.id === params.clientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">CRM</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Opportunities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sales pipeline from discovery through won and lost deals.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link
              href={
                params.clientId
                  ? `/opportunities/new?clientId=${params.clientId}`
                  : "/opportunities/new"
              }
            >
              <Plus className="h-4 w-4" />
              New opportunity
            </Link>
          </Button>
        ) : null}
      </div>

      <OpportunityPipelineSummary summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search deal, client, or description" />
        <OpportunityStageFilter />
        <OpportunityClientFilter clients={clients} />
      </FilterBar>

      {selectedClient ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/clients/${selectedClient.id}`} className="font-medium hover:underline">
            {selectedClient.company.name}
          </Link>
          {" · "}
          <Link href="/opportunities" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          description="Create a deal to track value, stage, and expected close date."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/opportunities/new">Create opportunity</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} opportunities</p>
          <OpportunitiesTable opportunities={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              stage: params.stage,
              clientId: params.clientId,
            }}
          />
        </>
      )}
    </div>
  );
}
