import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { bidRequestListFilterSchema } from "@/modules/bidding/validation";
import {
  getBiddingSummary,
  listBidRequests,
} from "@/modules/bidding/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { BidRequestsTable } from "@/components/bidding/bid-requests-table";
import { BidRequestStatusFilter } from "@/components/bidding/bid-request-status-filter";

export const metadata = { title: "Bidding" };

export default async function BiddingPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    projectId?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "BID_REQUEST_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to bidding"
        description="Ask an owner or project manager to grant BID_REQUEST_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = bidRequestListFilterSchema.parse({
    search: params.q,
    status: params.status,
    projectId: params.projectId,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  try {
    [result, summary] = await Promise.all([
      listBidRequests(ctx, filter),
      getBiddingSummary(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to bidding"
          description="Ask an owner or project manager to grant BID_REQUEST_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load bidding"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "BID_REQUEST_CREATE");
  const canViewMyBids = hasPermission(ctx.permissions, "BID_VIEW");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Bidding"
        description="Open requests, compare bids, negotiate, and award a single winner."
        actions={
          canViewMyBids || canCreate ? (
            <>
              {canViewMyBids ? (
                <Button variant="outline" asChild className="shrink-0">
                  <Link href="/bidding/my-bids">My bids</Link>
                </Button>
              ) : null}
              {canCreate ? (
                <Button asChild className="shrink-0">
                  <Link
                    href={
                      params.projectId
                        ? `/bidding/requests/new?projectId=${params.projectId}`
                        : "/bidding/requests/new"
                    }
                  >
                    <Plus className="h-4 w-4" />
                    New request
                  </Link>
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Open requests" value={String(summary.openRequests)} />
        <SummaryCard label="Active bids" value={String(summary.submittedBids)} />
        <SummaryCard label="Awarded" value={String(summary.awardedRequests)} />
      </div>

      <FilterBar>
        <SearchInput placeholder="Search request or project" />
        <BidRequestStatusFilter />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No bid requests yet"
          description="Create a request on a project to collect and compare bids."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/bidding/requests/new">Create bid request</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="requests" />
          <BidRequestsTable requests={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              projectId: params.projectId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
