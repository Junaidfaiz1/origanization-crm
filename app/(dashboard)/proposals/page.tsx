import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { proposalListFilterSchema } from "@/modules/proposals/validation";
import {
  listProposalClientOptions,
  listProposalOpportunityOptions,
  listProposals,
} from "@/modules/proposals/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ProposalsTable } from "@/components/proposals/proposals-table";
import { ProposalClientFilter } from "@/components/proposals/proposal-client-filter";
import { ProposalStatusFilter } from "@/components/proposals/proposal-status-filter";
import { ProposalOpportunityFilter } from "@/components/proposals/proposal-opportunity-filter";

export const metadata = { title: "Proposals" };

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    clientId?: string;
    opportunityId?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PROPOSAL_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to proposals"
        description="Ask an owner or sales manager to grant PROPOSAL_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = proposalListFilterSchema.parse({
    search: params.q,
    status: params.status,
    clientId: params.clientId,
    opportunityId: params.opportunityId,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let clients;
  let opportunities;
  try {
    [result, clients, opportunities] = await Promise.all([
      listProposals(ctx, filter),
      listProposalClientOptions(ctx),
      listProposalOpportunityOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to proposals"
          description="Ask an owner or sales manager to grant PROPOSAL_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load proposals"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "PROPOSAL_CREATE");
  const selectedClient = clients.find((client) => client.id === params.clientId);
  const selectedOpportunity = opportunities.find(
    (opportunity) => opportunity.id === params.opportunityId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">CRM</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Proposals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft, send, and track client proposals. Accepted proposals become projects.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link
              href={
                params.opportunityId
                  ? `/proposals/new?opportunityId=${params.opportunityId}`
                  : "/proposals/new"
              }
            >
              <Plus className="h-4 w-4" />
              New proposal
            </Link>
          </Button>
        ) : null}
      </div>

      <FilterBar>
        <SearchInput placeholder="Search proposal, client, or opportunity" />
        <ProposalStatusFilter />
        <ProposalClientFilter
          clients={clients.map((client) => ({ id: client.id, name: client.company.name }))}
        />
        <ProposalOpportunityFilter
          opportunities={opportunities.map((opportunity) => ({
            id: opportunity.id,
            name: opportunity.name,
          }))}
        />
      </FilterBar>

      {selectedClient || selectedOpportunity ? (
        <p className="text-sm text-muted-foreground">
          {selectedClient ? (
            <>
              Filtered to{" "}
              <Link href={`/clients/${selectedClient.id}`} className="font-medium hover:underline">
                {selectedClient.company.name}
              </Link>
            </>
          ) : null}
          {selectedClient && selectedOpportunity ? " · " : null}
          {selectedOpportunity ? (
            <>
              Opportunity{" "}
              <Link
                href={`/opportunities/${selectedOpportunity.id}`}
                className="font-medium hover:underline"
              >
                {selectedOpportunity.name}
              </Link>
            </>
          ) : null}
          {" · "}
          <Link href="/proposals" className="hover:underline">
            Clear filters
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          description="Create a proposal with line items, discount, tax, and approval workflow."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/proposals/new">Create proposal</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} proposals</p>
          <ProposalsTable proposals={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              clientId: params.clientId,
              opportunityId: params.opportunityId,
            }}
          />
        </>
      )}
    </div>
  );
}
