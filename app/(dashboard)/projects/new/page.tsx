import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { ProjectForm } from "@/components/projects/project-form";
import {
  listProjectClientOptions,
  listProjectOpportunityOptions,
  listProjectProposalOptions,
} from "@/modules/projects/service";
import { listAssignableUsers } from "@/modules/leads/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New project" };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; opportunityId?: string; proposalId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_CREATE")) {
    return (
      <ErrorState
        title="You cannot create projects"
        description="Ask an owner or project manager to grant PROJECT_CREATE."
      />
    );
  }

  const params = await searchParams;
  const [clients, opportunities, proposals, managers] = await Promise.all([
    listProjectClientOptions(ctx),
    listProjectOpportunityOptions(ctx),
    listProjectProposalOptions(ctx),
    listAssignableUsers(ctx.organizationId),
  ]);

  if (clients.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a client first"
          description="Projects must belong to an active client account."
        />
        <p className="text-center text-sm">
          <Link href="/clients/new" className="font-medium hover:underline">
            Create client
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
          ← Projects
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Create project</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            clients={clients}
            opportunities={opportunities}
            proposals={proposals}
            managers={managers}
            defaultClientId={params.clientId}
            defaultOpportunityId={params.opportunityId}
            defaultProposalId={params.proposalId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
