import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getLead, listAssignableUsers } from "@/modules/leads/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { LeadForm } from "@/components/leads/lead-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit lead" };

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "LEAD_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit leads"
        description="Ask an owner or sales manager to grant LEAD_UPDATE."
      />
    );
  }

  const { id } = await params;
  let lead;
  try {
    lead = await getLead(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    throw error;
  }

  const assignees = await listAssignableUsers(ctx.organizationId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/leads/${lead.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {lead.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit lead
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm lead={lead} assignees={assignees} />
        </CardContent>
      </Card>
    </div>
  );
}
