import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BidRequestDetailActions } from "@/components/bidding/bid-request-detail-actions";
import {
  BidComparisonTable,
  SubmitBidForm,
} from "@/components/bidding/bid-comparison-table";
import {
  getBidRequest,
  listBids,
  listBidsForComparison,
} from "@/modules/bidding/service";

export const metadata = { title: "Bid request" };

export default async function BidRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  let request;
  try {
    request = await getBidRequest(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this bid request"
        description="Check the database connection and try again."
      />
    );
  }

  const canManage = hasPermission(ctx.permissions, "BID_SHORTLIST")
    || hasPermission(ctx.permissions, "BID_ACCEPT");
  const canEdit =
    hasPermission(ctx.permissions, "BID_REQUEST_UPDATE") && request.status === "DRAFT";
  const canOpen =
    hasPermission(ctx.permissions, "BID_REQUEST_OPEN") &&
    (request.status === "DRAFT" || request.status === "PAUSED");
  const canPause =
    hasPermission(ctx.permissions, "BID_REQUEST_UPDATE") && request.status === "OPEN";
  const canClose =
    hasPermission(ctx.permissions, "BID_REQUEST_CLOSE") &&
    (request.status === "OPEN" || request.status === "PAUSED");
  const canCancel =
    hasPermission(ctx.permissions, "BID_REQUEST_UPDATE") &&
    request.status !== "AWARDED" &&
    request.status !== "CANCELLED";
  const canSubmit =
    hasPermission(ctx.permissions, "BID_SUBMIT") && request.status === "OPEN";

  let comparisonBids: Awaited<ReturnType<typeof listBidsForComparison>>["bids"] = [];
  let myBids: Awaited<ReturnType<typeof listBids>>["nodes"] = [];

  if (canManage) {
    try {
      const comparison = await listBidsForComparison(ctx, id);
      comparisonBids = comparison.bids;
    } catch {
      comparisonBids = [];
    }
  } else if (hasPermission(ctx.permissions, "BID_VIEW")) {
    const mine = await listBids(ctx, { bidRequestId: id, mineOnly: true, first: 20 });
    myBids = mine.nodes;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/bidding" className="text-sm text-muted-foreground hover:text-foreground">
            ← Bidding
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{request.title}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${request.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {request.project.name}
            </Link>
            {" · "}
            {request.project.clientName}
            {" · "}
            {request.biddingType}
          </p>
        </div>
        <BidRequestDetailActions
          requestId={request.id}
          status={request.status}
          canEdit={canEdit}
          canOpen={canOpen}
          canPause={canPause}
          canClose={canClose}
          canCancel={canCancel}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Budget">
              <MoneyDisplay amount={request.budgetMin} currency={request.currency} />
              {" – "}
              <MoneyDisplay amount={request.budgetMax} currency={request.currency} />
            </Field>
            <Field label="Created by" value={request.createdBy.name} />
            <Field label="Deadline">
              {request.deadline ? <DateDisplay value={request.deadline} /> : "—"}
            </Field>
            <Field label="Ends">
              {request.endsAt ? <DateDisplay value={request.endsAt} /> : "—"}
            </Field>
            <Field label="Description" value={request.description} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Award</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bids</span>
              <span className="font-medium">{request.bidCount}</span>
            </div>
            {request.awardedBid ? (
              <div>
                <p className="text-xs text-muted-foreground">Winner</p>
                <p className="mt-1 font-medium">{request.awardedBid.bidder.name}</p>
                <p className="text-muted-foreground">
                  <MoneyDisplay
                    amount={request.awardedBid.amount}
                    currency={request.currency}
                  />{" "}
                  · {request.awardedBid.estimatedDays} days
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No winner yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {canManage ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Compare bids</h2>
          <BidComparisonTable
            bids={comparisonBids}
            currency={request.currency}
            canShortlist={hasPermission(ctx.permissions, "BID_SHORTLIST")}
            canReject={hasPermission(ctx.permissions, "BID_REJECT")}
            canAccept={hasPermission(ctx.permissions, "BID_ACCEPT")}
            canNegotiate={
              hasPermission(ctx.permissions, "BID_SHORTLIST") ||
              hasPermission(ctx.permissions, "BID_ACCEPT")
            }
          />
        </div>
      ) : null}

      {!canManage && myBids.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your bid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {myBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between gap-3">
                <div>
                  <StatusBadge status={bid.status} />
                  <p className="mt-2">
                    <MoneyDisplay amount={bid.amount} currency={request.currency} /> ·{" "}
                    {bid.estimatedDays} days
                  </p>
                </div>
                <Link href={`/bidding/my-bids/${bid.id}`} className="font-medium hover:underline">
                  View
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {canSubmit && myBids.length === 0 ? <SubmitBidForm bidRequestId={request.id} /> : null}
    </div>
  );
}

function Field({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children ?? value ?? "—"}</div>
    </div>
  );
}
