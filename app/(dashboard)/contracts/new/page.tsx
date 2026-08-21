import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { ContractForm } from "@/components/contracts/contract-form";
import {
  listContractBidOptions,
  listContractProjectOptions,
  listContractResourceOptions,
} from "@/modules/contracts/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New contract" };

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; bidId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "CONTRACT_CREATE")) {
    return (
      <ErrorState
        title="You cannot create contracts"
        description="Ask a project manager to grant CONTRACT_CREATE."
      />
    );
  }

  const params = await searchParams;
  const [projects, resources] = await Promise.all([
    listContractProjectOptions(ctx),
    listContractResourceOptions(ctx),
  ]);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="No projects available"
          description="Contracts must be linked to an active project."
        />
        <p className="text-center text-sm">
          <Link href="/projects" className="font-medium hover:underline">
            View projects
          </Link>
        </p>
      </div>
    );
  }

  const projectId = params.projectId ?? projects[0]?.id;
  const bids = projectId ? await listContractBidOptions(ctx, projectId) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/contracts" className="text-sm text-muted-foreground hover:text-foreground">
          ← Contracts
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">New contract</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contract details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm
            projects={projects}
            resources={resources}
            bids={bids}
            defaultProjectId={params.projectId}
            defaultBidId={params.bidId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
