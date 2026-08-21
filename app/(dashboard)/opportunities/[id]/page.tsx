import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getOpportunity } from "@/modules/opportunities/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpportunityDetailActions } from "@/components/opportunities/opportunity-detail-actions";

export const metadata = { title: "Opportunity" };

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "OPPORTUNITY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to opportunities"
        description="Ask an owner or sales manager to grant OPPORTUNITY_VIEW."
      />
    );
  }

  const { id } = await params;

  let opportunity;
  try {
    opportunity = await getOpportunity(ctx, id);
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

  const canUpdate =
    hasPermission(ctx.permissions, "OPPORTUNITY_UPDATE") && !opportunity.archivedAt;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/opportunities"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Opportunities
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {opportunity.name}
            </h1>
            <StatusBadge status={opportunity.stage} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/clients/${opportunity.clientId}`}
              className="hover:text-foreground hover:underline"
            >
              {opportunity.client.companyName}
            </Link>{" "}
            · Created <DateDisplay value={opportunity.createdAt} />
          </p>
        </div>
        <OpportunityDetailActions opportunityId={opportunity.id} canUpdate={canUpdate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Deal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Estimated value">
              <MoneyDisplay amount={opportunity.estimatedValue} />
            </Field>
            <Field label="Weighted value">
              <MoneyDisplay amount={opportunity.weightedValue} />
              <span className="ml-1 text-xs text-muted-foreground">
                ({opportunity.probability}%)
              </span>
            </Field>
            <Field
              label="Expected close"
              value={
                opportunity.expectedCloseDate ? (
                  <DateDisplay value={opportunity.expectedCloseDate} />
                ) : (
                  "—"
                )
              }
            />
            <Field label="Assignee" value={opportunity.assignedTo?.name} />
            <Field
              label="Description"
              value={opportunity.description}
              className="sm:col-span-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Proposals</span>
              <Link
                href={`/proposals?opportunityId=${opportunity.id}`}
                className="font-medium hover:underline"
              >
                {opportunity.proposalCount}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Projects</span>
              <Link
                href={`/projects?clientId=${opportunity.clientId}`}
                className="font-medium hover:underline"
              >
                {opportunity.projectCount}
              </Link>
            </div>
            {canUpdate ? (
              <Link
                href={`/proposals/new?opportunityId=${opportunity.id}`}
                className="inline-block text-xs font-medium hover:underline"
              >
                Create proposal for this opportunity
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children ?? value ?? "—"}</div>
    </div>
  );
}
