import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { listBids } from "@/modules/bidding/service";
import { bidListFilterSchema } from "@/modules/bidding/validation";
import { Pagination } from "@/components/shared/pagination";

export const metadata = { title: "My bids" };

export default async function MyBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "BID_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to bids"
        description="Ask an owner to grant BID_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = bidListFilterSchema.parse({
    mineOnly: true,
    cursor: params.cursor,
    first: 20,
  });

  const result = await listBids(ctx, filter);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/bidding" className="text-sm text-muted-foreground hover:text-foreground">
          ← Bidding
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">My bids</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your submissions and negotiation history. Other freelancers’ private bids stay hidden.
        </p>
      </div>

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No bids yet"
          description="Open an active bid request and submit your first offer."
        />
      ) : (
        <>
          <div className="space-y-3">
            {result.nodes.map((bid) => (
              <Link
                key={bid.id}
                href={`/bidding/my-bids/${bid.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{bid.bidRequest.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {bid.bidRequest.project.name}
                    </p>
                  </div>
                  <StatusBadge status={bid.status} />
                </div>
                <p className="mt-2 text-sm">
                  <MoneyDisplay amount={bid.amount} currency={bid.bidRequest.currency} /> ·{" "}
                  {bid.estimatedDays} days
                </p>
              </Link>
            ))}
          </div>
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{}}
          />
        </>
      )}
    </div>
  );
}
