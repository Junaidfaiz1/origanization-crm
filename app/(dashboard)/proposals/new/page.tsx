import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { listProposalOpportunityOptions } from "@/modules/proposals/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New proposal" };

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ opportunityId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROPOSAL_CREATE")) {
    return (
      <ErrorState
        title="You cannot create proposals"
        description="Ask an owner or sales manager to grant PROPOSAL_CREATE."
      />
    );
  }

  const params = await searchParams;
  const opportunities = await listProposalOpportunityOptions(ctx);

  if (opportunities.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create an opportunity first"
          description="Proposals must belong to an active opportunity."
        />
        <p className="text-center text-sm">
          <Link href="/opportunities/new" className="font-medium hover:underline">
            Create opportunity
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/proposals" className="text-sm text-muted-foreground hover:text-foreground">
          ← Proposals
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create proposal
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Proposal details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalForm
            opportunities={opportunities}
            defaultOpportunityId={params.opportunityId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
