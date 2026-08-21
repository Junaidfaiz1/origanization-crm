import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFreelancerUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { getFreelancerBidRequest } from "@/modules/freelancer-portal/service";
import { FreelancerSubmitBidForm } from "@/components/freelancer/freelancer-bid-forms";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Bid request" };

export default async function FreelancerRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireFreelancerUser();
  if (!hasPermission(ctx.permissions, "BID_REQUEST_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to bid requests"
        description="Ask the agency to grant BID_REQUEST_VIEW."
      />
    );
  }

  const { id } = await params;

  let request;
  try {
    request = await getFreelancerBidRequest(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this request"
        description="Check the database connection and try again."
      />
    );
  }

  const canSubmit =
    hasPermission(ctx.permissions, "BID_SUBMIT") &&
    request.status === "OPEN" &&
    !request.myBid;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/freelancer/requests"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Open requests
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {request.title}
          </h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {request.project.name}
          {request.project.clientName ? ` · ${request.project.clientName}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {request.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">{request.description}</p>
          ) : (
            <p className="text-muted-foreground">No description provided.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Budget: </span>
              {request.budgetMin || request.budgetMax ? (
                <>
                  {request.budgetMin ? (
                    <MoneyDisplay amount={request.budgetMin} currency={request.currency} />
                  ) : null}
                  {request.budgetMin && request.budgetMax ? " – " : null}
                  {request.budgetMax ? (
                    <MoneyDisplay amount={request.budgetMax} currency={request.currency} />
                  ) : null}
                </>
              ) : (
                "—"
              )}
            </p>
            <p>
              <span className="text-muted-foreground">Ends: </span>
              {request.endsAt ? <DateDisplay value={request.endsAt} /> : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Bids so far: </span>
              {request.bidCount}
            </p>
            {request.awardedBid ? (
              <p>
                <span className="text-muted-foreground">Award: </span>
                {"wonByOther" in request.awardedBid && request.awardedBid.wonByOther ? (
                  "Awarded to another freelancer"
                ) : (
                  <>
                    You won ·{" "}
                    <MoneyDisplay
                      amount={
                        "amount" in request.awardedBid ? request.awardedBid.amount : null
                      }
                      currency={request.currency}
                    />
                  </>
                )}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {request.myBid ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Your bid</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <MoneyDisplay amount={request.myBid.amount} currency={request.currency} />
                {" · "}
                <StatusBadge status={request.myBid.status} />
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={`/freelancer/bids/${request.myBid.id}`}>Open bid</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {canSubmit ? <FreelancerSubmitBidForm bidRequestId={request.id} /> : null}
    </div>
  );
}
