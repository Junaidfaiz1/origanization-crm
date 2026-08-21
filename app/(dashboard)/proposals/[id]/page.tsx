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
import { ProposalDetailActions } from "@/components/proposals/proposal-detail-actions";
import { getProposal } from "@/modules/proposals/service";
import { findProjectByProposalId } from "@/modules/projects/service";

export const metadata = { title: "Proposal" };

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  let proposal;
  let linkedProject;
  try {
    proposal = await getProposal(ctx, id);
    if (proposal.projectCount > 0) {
      linkedProject = await findProjectByProposalId(ctx, id);
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this proposal"
        description="Check the database connection and try again."
      />
    );
  }

  const canEdit =
    hasPermission(ctx.permissions, "PROPOSAL_UPDATE") &&
    !proposal.archivedAt &&
    (proposal.status === "DRAFT" || proposal.status === "CHANGES_REQUESTED");
  const canSend =
    hasPermission(ctx.permissions, "PROPOSAL_SEND") &&
    !proposal.archivedAt &&
    proposal.status === "DRAFT";
  const canAccept =
    hasPermission(ctx.permissions, "PROPOSAL_ACCEPT") &&
    !proposal.archivedAt &&
    ["SENT", "VIEWED", "CHANGES_REQUESTED"].includes(proposal.status);
  const canReject =
    hasPermission(ctx.permissions, "PROPOSAL_REJECT") &&
    !proposal.archivedAt &&
    ["SENT", "VIEWED", "CHANGES_REQUESTED"].includes(proposal.status);
  const canArchive =
    hasPermission(ctx.permissions, "PROPOSAL_UPDATE") && !proposal.archivedAt;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/proposals" className="text-sm text-muted-foreground hover:text-foreground">
            ← Proposals
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {proposal.title}
            </h1>
            <StatusBadge status={proposal.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/clients/${proposal.clientId}`}
              className="hover:text-foreground hover:underline"
            >
              {proposal.client.companyName}
            </Link>
            {" · "}
            <Link
              href={`/opportunities/${proposal.opportunityId}`}
              className="hover:text-foreground hover:underline"
            >
              {proposal.opportunity.name}
            </Link>
          </p>
        </div>
        <ProposalDetailActions
          proposalId={proposal.id}
          canEdit={canEdit}
          canSend={canSend}
          canAccept={canAccept}
          canReject={canReject}
          canArchive={canArchive}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proposal summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Created by" value={proposal.createdBy.name} />
            <Field label="Valid until" value={<DateDisplay value={proposal.validUntil} />} />
            <Field label="Sent at" value={<DateDisplay value={proposal.sentAt} />} />
            <Field label="Accepted at" value={<DateDisplay value={proposal.acceptedAt} />} />
            <Field label="Rejected at" value={<DateDisplay value={proposal.rejectedAt} />} />
            <Field label="Description" value={proposal.description} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <TotalsRow label="Subtotal" amount={proposal.subtotal} currency={proposal.currency} />
            <TotalsRow label="Discount" amount={proposal.discount} currency={proposal.currency} />
            <TotalsRow label="Tax" amount={proposal.tax} currency={proposal.currency} />
            <TotalsRow
              label="Total"
              amount={proposal.total}
              currency={proposal.currency}
              strong
            />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Project</span>
              {linkedProject ? (
                <Link href={`/projects/${linkedProject.id}`} className="font-medium hover:underline">
                  {linkedProject.name}
                </Link>
              ) : (
                <span className="font-medium">{proposal.projectCount}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {proposal.items.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_7rem_8rem_8rem]"
            >
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="mt-1 text-sm">{item.description}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Qty</p>
                <p className="mt-1 text-sm">{item.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit price</p>
                <p className="mt-1 text-sm">
                  <MoneyDisplay amount={item.unitPrice} currency={proposal.currency} />
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 text-sm">
                  <MoneyDisplay amount={item.total} currency={proposal.currency} />
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{value || "—"}</div>
    </div>
  );
}

function TotalsRow({
  label,
  amount,
  currency,
  strong = false,
}: {
  label: string;
  amount: string | null;
  currency: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : undefined}>
        <MoneyDisplay amount={amount} currency={currency} />
      </span>
    </div>
  );
}
