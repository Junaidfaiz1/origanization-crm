import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { listOpportunityClientOptions } from "@/modules/opportunities/service";
import { listAssignableUsers } from "@/modules/leads/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New opportunity" };

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "OPPORTUNITY_CREATE")) {
    return (
      <ErrorState
        title="You cannot create opportunities"
        description="Ask an owner or sales manager to grant OPPORTUNITY_CREATE."
      />
    );
  }

  const params = await searchParams;
  const [clients, assignees] = await Promise.all([
    listOpportunityClientOptions(ctx),
    listAssignableUsers(ctx.organizationId),
  ]);

  if (clients.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a client first"
          description="Opportunities must belong to an active client account."
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
        <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">
          ← Opportunities
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create opportunity
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Deal details</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityForm
            clients={clients}
            assignees={assignees}
            defaultClientId={params.clientId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
