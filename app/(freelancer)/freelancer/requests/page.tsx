import Link from "next/link";
import { requireFreelancerUser } from "@/lib/auth/page";
import { listFreelancerOpenRequests } from "@/modules/freelancer-portal/service";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Open requests" };

export default async function FreelancerRequestsPage() {
  const ctx = await requireFreelancerUser();

  let requests;
  try {
    requests = await listFreelancerOpenRequests(ctx);
  } catch {
    return (
      <ErrorState
        title="Could not load bid requests"
        description="You may be missing BID_REQUEST_VIEW, or the service is unavailable."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Open requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Eligible open work. Competing bids stay private.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No open requests"
          description="Check back when the agency publishes new bidding work."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/freelancer/requests/${request.id}`}
                      className="font-medium hover:underline"
                    >
                      {request.title}
                    </Link>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.project.name}
                    {request.budgetMin || request.budgetMax ? (
                      <>
                        {" · "}
                        {request.budgetMin ? (
                          <MoneyDisplay
                            amount={request.budgetMin}
                            currency={request.currency}
                          />
                        ) : null}
                        {request.budgetMin && request.budgetMax ? " – " : null}
                        {request.budgetMax ? (
                          <MoneyDisplay
                            amount={request.budgetMax}
                            currency={request.currency}
                          />
                        ) : null}
                      </>
                    ) : null}
                    {request.endsAt ? (
                      <>
                        {" · Ends "}
                        <DateDisplay value={request.endsAt} />
                      </>
                    ) : null}
                  </p>
                </div>
                <Link
                  href={`/freelancer/requests/${request.id}`}
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
