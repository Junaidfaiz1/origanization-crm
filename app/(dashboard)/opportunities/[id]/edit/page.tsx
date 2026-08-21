import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getOpportunity, listOpportunityClientOptions } from "@/modules/opportunities/service";
import { listAssignableUsers } from "@/modules/leads/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit opportunity" };

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "OPPORTUNITY_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit opportunities"
        description="Ask an owner or sales manager to grant OPPORTUNITY_UPDATE."
      />
    );
  }

  const { id } = await params;

  let opportunity;
  let clients;
  let assignees;
  try {
    [opportunity, clients, assignees] = await Promise.all([
      getOpportunity(ctx, id),
      listOpportunityClientOptions(ctx),
      listAssignableUsers(ctx.organizationId),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this opportunity"
        description="Check the database connection and try again."
      />
    );
  }

  if (opportunity.archivedAt) {
    return (
      <ErrorState
        title="Archived opportunities cannot be edited"
        description="Restore is not available yet. Create a new opportunity if needed."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {opportunity.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit opportunity
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Deal details</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityForm
            opportunity={opportunity}
            clients={clients}
            assignees={assignees}
          />
        </CardContent>
      </Card>
    </div>
  );
}
