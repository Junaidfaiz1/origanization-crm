import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { opportunityListFilterSchema } from "@/modules/opportunities/validation";
import {
  getOpportunityPipelineSummary,
  listOpportunities,
  listOpportunitiesForKanban,
  listOpportunityClientOptions,
} from "@/modules/opportunities/service";
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
import { OpportunitiesTable } from "@/components/opportunities/opportunities-table";
import { OpportunityKanbanBoard } from "@/components/opportunities/opportunity-kanban-board";
import { OpportunityViewToggle } from "@/components/opportunities/opportunity-view-toggle";
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
    sort?: string;
    cursor?: string;
    view?: string;
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
  const isKanban = params.view === "kanban";
  const filter = opportunityListFilterSchema.parse({
    search: params.q,
    stage: isKanban ? undefined : params.stage,
    clientId: params.clientId,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result: Awaited<ReturnType<typeof listOpportunities>> | null = null;
  let kanban: Awaited<ReturnType<typeof listOpportunitiesForKanban>> | null =
    null;
  let summary;
  let clients;
  try {
    const [listOrNull, boardOrNull, pipeline, clientOptions] = await Promise.all([
      isKanban ? Promise.resolve(null) : listOpportunities(ctx, filter),
      isKanban ? listOpportunitiesForKanban(ctx, filter) : Promise.resolve(null),
      getOpportunityPipelineSummary(ctx),
      listOpportunityClientOptions(ctx),
    ]);
    result = listOrNull;
    kanban = boardOrNull;
    summary = pipeline;
    clients = clientOptions;
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
  const empty =
    (isKanban && (kanban?.totalCount ?? 0) === 0) ||
    (!isKanban && (result?.nodes.length ?? 0) === 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Opportunities"
        description="Sales pipeline from discovery through won and lost deals."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OpportunityViewToggle />
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
        }
      />

      <OpportunityPipelineSummary summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search deal, client, or description" />
        {!isKanban ? <OpportunityStageFilter /> : null}
        <OpportunityClientFilter clients={clients} />
        {!isKanban ? (
          <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
        ) : null}
      </FilterBar>

      {selectedClient ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link
            href={`/clients/${selectedClient.id}`}
            className="font-medium hover:underline"
          >
            {selectedClient.company.name}
          </Link>
          {" · "}
          <Link href="/opportunities" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {empty ? (
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
      ) : isKanban && kanban ? (
        <>
          <ResultCount count={kanban.totalCount} label="opportunities" />
          <OpportunityKanbanBoard board={kanban} />
        </>
      ) : result ? (
        <>
          <ResultCount count={result.totalCount} label="opportunities" />
          <OpportunitiesTable opportunities={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              stage: params.stage,
              clientId: params.clientId,
              sort: params.sort,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
