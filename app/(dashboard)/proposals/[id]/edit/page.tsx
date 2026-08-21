import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProposal, listProposalOpportunityOptions } from "@/modules/proposals/service";

export const metadata = { title: "Edit proposal" };

export default async function EditProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROPOSAL_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit proposals"
        description="Ask an owner or sales manager to grant PROPOSAL_UPDATE."
      />
    );
  }

  const { id } = await params;

  let proposal;
  let opportunities;
  try {
    [proposal, opportunities] = await Promise.all([
      getProposal(ctx, id),
      listProposalOpportunityOptions(ctx),
    ]);
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

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(proposal.status) || proposal.archivedAt) {
    return (
      <ErrorState
        title="This proposal cannot be edited"
        description="Only draft or changes-requested proposals can be edited."
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href={`/proposals/${proposal.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {proposal.title}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit proposal
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Proposal details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalForm proposal={proposal} opportunities={opportunities} />
        </CardContent>
      </Card>
    </div>
  );
}
