import Link from "next/link";
import { requireFreelancerUser } from "@/lib/auth/page";
import { listFreelancerBids } from "@/modules/freelancer-portal/service";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "My bids" };

export default async function FreelancerBidsPage() {
  const ctx = await requireFreelancerUser();

  let bids;
  try {
    bids = await listFreelancerBids(ctx);
  } catch {
    return (
      <ErrorState
        title="Could not load bids"
        description="You may be missing BID_VIEW, or the service is unavailable."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">My bids</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only your bids are listed here. Competing offers are never shown.
        </p>
      </div>

      {bids.length === 0 ? (
        <EmptyState
          title="No bids yet"
          description="Submit a bid on an open request to track it here."
        />
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <Card key={bid.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/freelancer/bids/${bid.id}`}
                      className="font-medium hover:underline"
                    >
                      {bid.bidRequest.title}
                    </Link>
                    <StatusBadge status={bid.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <MoneyDisplay
                      amount={bid.amount}
                      currency={bid.bidRequest.currency}
                    />
                    {" · "}
                    {bid.estimatedDays} days
                    {" · "}
                    {bid.bidRequest.project.name}
                  </p>
                </div>
                <Link
                  href={`/freelancer/bids/${bid.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
