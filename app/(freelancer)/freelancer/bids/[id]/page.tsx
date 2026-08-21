import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFreelancerUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { getFreelancerBid } from "@/modules/freelancer-portal/service";
import { ACTIVE_BID_STATUSES } from "@/modules/bidding/rules";
import { FreelancerNegotiateBidForm } from "@/components/freelancer/freelancer-bid-forms";
import { withdrawFreelancerBidAction } from "@/modules/freelancer-portal/actions";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "My bid" };

export default async function FreelancerBidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireFreelancerUser();
  if (!hasPermission(ctx.permissions, "BID_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to bids"
        description="Ask the agency to grant BID_VIEW."
      />
    );
  }

  const { id } = await params;

  let bid;
  try {
    bid = await getFreelancerBid(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this bid"
        description="Check the database connection and try again."
      />
    );
  }

  const canWithdraw =
    hasPermission(ctx.permissions, "BID_UPDATE") &&
    ACTIVE_BID_STATUSES.includes(bid.status as (typeof ACTIVE_BID_STATUSES)[number]);
  const canNegotiate =
    hasPermission(ctx.permissions, "BID_UPDATE") &&
    ["SUBMITTED", "SHORTLISTED", "NEGOTIATION"].includes(bid.status) &&
    (bid.bidRequest.status === "OPEN" || bid.bidRequest.status === "PAUSED");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/freelancer/bids"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← My bids
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {bid.bidRequest.title}
            </h1>
            <StatusBadge status={bid.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/freelancer/requests/${bid.bidRequestId}`}
              className="hover:underline"
            >
              View request
            </Link>
            {" · "}
            {bid.bidRequest.project.name}
          </p>
        </div>
        {canWithdraw ? (
          <ConfirmDialog
            title="Withdraw this bid?"
            description="You can submit again later if the request is still open."
            confirmLabel="Withdraw"
            destructive
            hiddenFields={{ id: bid.id }}
            action={withdrawFreelancerBidAction}
            trigger={
              <Button type="button" variant="outline">
                Withdraw
              </Button>
            }
          />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your offer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Amount: </span>
            <MoneyDisplay amount={bid.amount} currency={bid.bidRequest.currency} />
          </p>
          <p>
            <span className="text-muted-foreground">Estimated days: </span>
            {bid.estimatedDays}
          </p>
          <p>
            <span className="text-muted-foreground">Submitted: </span>
            {bid.submittedAt ? <DateDisplay value={bid.submittedAt} /> : "—"}
          </p>
          {bid.proposal ? (
            <p className="sm:col-span-2 whitespace-pre-wrap text-muted-foreground">
              {bid.proposal}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {bid.negotiations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Negotiation history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bid.negotiations.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{row.sender.name}</p>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-1 text-muted-foreground">
                  <MoneyDisplay amount={row.amount} currency={bid.bidRequest.currency} />
                  {" · "}
                  {row.estimatedDays} days
                  {" · "}
                  <DateDisplay value={row.createdAt} />
                </p>
                {row.message ? (
                  <p className="mt-2 text-muted-foreground">{row.message}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canNegotiate ? <FreelancerNegotiateBidForm bidId={bid.id} /> : null}
    </div>
  );
}
