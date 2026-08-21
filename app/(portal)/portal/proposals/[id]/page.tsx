import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortalUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { getPortalProposal } from "@/modules/client-portal/service";
import {
  acceptPortalProposalAction,
  rejectPortalProposalAction,
} from "@/modules/client-portal/actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Proposal" };

export default async function PortalProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePortalUser();
  const { id } = await params;

  let proposal;
  try {
    proposal = await getPortalProposal(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    return (
      <ErrorState title="Could not load proposal" description="Try again shortly." />
    );
  }

  const canRespond =
    ["SENT", "VIEWED", "CHANGES_REQUESTED"].includes(proposal.status) &&
    (hasPermission(ctx.permissions, "PROPOSAL_ACCEPT") ||
      hasPermission(ctx.permissions, "PROPOSAL_REJECT"));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/portal/proposals"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Proposals
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {proposal.title}
            </h1>
            <StatusBadge status={proposal.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{proposal.opportunityName}</p>
        </div>
        {canRespond ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            {hasPermission(ctx.permissions, "PROPOSAL_ACCEPT") ? (
              <ConfirmDialog
                title="Accept this proposal?"
                description="Accepting confirms the work and lets the agency start the project."
                confirmLabel="Accept"
                hiddenFields={{ id: proposal.id }}
                action={acceptPortalProposalAction}
                trigger={<Button type="button">Accept</Button>}
              />
            ) : null}
            {hasPermission(ctx.permissions, "PROPOSAL_REJECT") ? (
              <ConfirmDialog
                title="Reject this proposal?"
                description="The agency will be notified that this proposal was declined."
                confirmLabel="Reject"
                destructive
                hiddenFields={{ id: proposal.id }}
                action={rejectPortalProposalAction}
                trigger={
                  <Button type="button" variant="outline">
                    Reject
                  </Button>
                }
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Qty</th>
                    <th className="px-3 py-2 font-medium">Unit</th>
                    <th className="px-3 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {proposal.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">
                        <MoneyDisplay amount={item.unitPrice} currency={proposal.currency} />
                      </td>
                      <td className="px-3 py-2">
                        <MoneyDisplay amount={item.total} currency={proposal.currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {proposal.description ? (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {proposal.description}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <MoneyDisplay amount={proposal.subtotal} currency={proposal.currency} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <MoneyDisplay amount={proposal.discount} currency={proposal.currency} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <MoneyDisplay amount={proposal.tax} currency={proposal.currency} />
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-semibold">
              <span>Total</span>
              <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Valid until</span>
              {proposal.validUntil ? <DateDisplay value={proposal.validUntil} /> : "—"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
