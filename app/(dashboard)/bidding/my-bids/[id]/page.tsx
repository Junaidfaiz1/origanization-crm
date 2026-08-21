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
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getBid } from "@/modules/bidding/service";
import { withdrawBidAction } from "@/modules/bidding/actions";
import { ACTIVE_BID_STATUSES } from "@/modules/bidding/rules";
import { MyBidNegotiateForm } from "@/components/bidding/my-bid-negotiate-form";

export const metadata = { title: "My bid" };

export default async function MyBidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  let bid;
  try {
    bid = await getBid(ctx, id);
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

  const isOwner = bid.bidderId === ctx.userId;
  const canWithdraw =
    isOwner &&
    hasPermission(ctx.permissions, "BID_UPDATE") &&
    ACTIVE_BID_STATUSES.includes(bid.status as (typeof ACTIVE_BID_STATUSES)[number]);
  const canNegotiate =
    isOwner &&
    hasPermission(ctx.permissions, "BID_UPDATE") &&
    ["SUBMITTED", "SHORTLISTED", "NEGOTIATION"].includes(bid.status) &&
    (bid.bidRequest.status === "OPEN" || bid.bidRequest.status === "PAUSED");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/bidding/my-bids"
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
              href={`/bidding/requests/${bid.bidRequestId}`}
              className="hover:text-foreground hover:underline"
            >
              View request
            </Link>
          </p>
        </div>
        {canWithdraw ? (
          <ConfirmDialog
            title="Withdraw this bid?"
            description="You can submit again later only if the request is still open and policy allows."
            confirmLabel="Withdraw"
            destructive
            hiddenFields={{ id: bid.id }}
            action={withdrawBidAction}
            trigger={
              <Button variant="outline" type="button">
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
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount">
            <MoneyDisplay amount={bid.amount} currency={bid.bidRequest.currency} />
          </Field>
          <Field label="Estimated days" value={String(bid.estimatedDays)} />
          <Field label="Submitted">
            {bid.submittedAt ? <DateDisplay value={bid.submittedAt} /> : "—"}
          </Field>
          <Field label="Proposal" value={bid.proposal} className="sm:col-span-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Negotiation history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bid.negotiations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No negotiation messages yet.</p>
          ) : (
            bid.negotiations.map((row) => (
              <div key={row.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{row.sender.name}</p>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-1 text-muted-foreground">
                  <MoneyDisplay amount={row.amount} currency={bid.bidRequest.currency} /> ·{" "}
                  {row.estimatedDays} days · <DateDisplay value={row.createdAt} />
                </p>
                {row.message ? <p className="mt-2">{row.message}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {canNegotiate ? <MyBidNegotiateForm bidId={bid.id} /> : null}
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
