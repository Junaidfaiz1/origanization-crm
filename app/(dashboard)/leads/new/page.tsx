import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { listAssignableUsers } from "@/modules/leads/service";
import { ErrorState } from "@/components/shared/error-state";
import { LeadForm } from "@/components/leads/lead-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New lead" };

export default async function NewLeadPage() {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "LEAD_CREATE")) {
    return (
      <ErrorState
        title="You cannot create leads"
        description="Ask an owner or sales manager to grant LEAD_CREATE."
      />
    );
  }

  const assignees = await listAssignableUsers(ctx.organizationId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/leads" className="text-sm text-muted-foreground hover:text-foreground">
          ← Leads
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create lead
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm assignees={assignees} />
        </CardContent>
      </Card>
    </div>
  );
}
