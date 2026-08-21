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
import { ProjectDetailActions } from "@/components/projects/project-detail-actions";
import { getProject } from "@/modules/projects/service";
import { isProjectClosed } from "@/modules/projects/rules";

export const metadata = { title: "Project" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to projects"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const { id } = await params;

  let project;
  try {
    project = await getProject(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this project"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpdate =
    hasPermission(ctx.permissions, "PROJECT_UPDATE") && !project.archivedAt;
  const canArchive =
    hasPermission(ctx.permissions, "PROJECT_DELETE") && !project.archivedAt;
  const canManageMilestones = canUpdate && !isProjectClosed(project.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
            ← Projects
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/clients/${project.clientId}`}
              className="hover:text-foreground hover:underline"
            >
              {project.client.companyName}
            </Link>
            {project.opportunity ? (
              <>
                {" · "}
                <Link
                  href={`/opportunities/${project.opportunity.id}`}
                  className="hover:text-foreground hover:underline"
                >
                  {project.opportunity.name}
                </Link>
              </>
            ) : null}
            {" · Created "}
            <DateDisplay value={project.createdAt} />
          </p>
        </div>
        <ProjectDetailActions
          projectId={project.id}
          canUpdate={canUpdate}
          canArchive={canArchive}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Manager" value={project.manager?.name} />
            <Field label="Proposal">
              {project.proposal ? (
                <Link
                  href={`/proposals/${project.proposal.id}`}
                  className="hover:underline"
                >
                  {project.proposal.title}
                </Link>
              ) : (
                "—"
              )}
            </Field>
            <Field label="Start date">
              {project.startDate ? <DateDisplay value={project.startDate} /> : "—"}
            </Field>
            <Field label="End date">
              {project.endDate ? <DateDisplay value={project.endDate} /> : "—"}
            </Field>
            <Field label="Budget">
              <MoneyDisplay amount={project.budget} />
            </Field>
            <Field label="Estimated cost">
              <MoneyDisplay amount={project.estimatedCost} />
            </Field>
            <Field label="Actual cost">
              <MoneyDisplay amount={project.actualCost} />
            </Field>
            <Field label="Description" value={project.description} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bid requests</span>
              <Link
                href={`/bidding?projectId=${project.id}`}
                className="font-medium hover:underline"
              >
                {project.bidRequestCount}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Milestones</span>
              <Link
                href={`/milestones?projectId=${project.id}`}
                className="font-medium hover:underline"
              >
                {project.milestoneCount}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tasks</span>
              <Link
                href={`/tasks?projectId=${project.id}`}
                className="font-medium hover:underline"
              >
                {project.taskCount}
              </Link>
            </div>
            {hasPermission(ctx.permissions, "TIME_ENTRY_VIEW") ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time logged</span>
                <Link
                  href={`/time-tracking?projectId=${project.id}`}
                  className="font-medium hover:underline"
                >
                  View entries
                </Link>
              </div>
            ) : null}
            {hasPermission(ctx.permissions, "EXPENSE_VIEW") ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expenses</span>
                <Link
                  href={`/expenses?projectId=${project.id}`}
                  className="font-medium hover:underline"
                >
                  View expenses
                </Link>
              </div>
            ) : null}
            {hasPermission(ctx.permissions, "CONTRACT_VIEW") ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contracts</span>
                <Link
                  href={`/contracts?projectId=${project.id}`}
                  className="font-medium hover:underline"
                >
                  View contracts
                </Link>
              </div>
            ) : null}
            {hasPermission(ctx.permissions, "INVOICE_VIEW") ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Invoices</span>
                <Link
                  href={`/invoices?projectId=${project.id}`}
                  className="font-medium hover:underline"
                >
                  View invoices
                </Link>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Team members</span>
              <span className="font-medium">{project.memberCount}</span>
            </div>
            {canManageMilestones ? (
              <>
                <Link
                  href={`/milestones/new?projectId=${project.id}`}
                  className="inline-block text-xs font-medium hover:underline"
                >
                  Add milestone
                </Link>
                {hasPermission(ctx.permissions, "TASK_CREATE") ? (
                  <Link
                    href={`/tasks/new?projectId=${project.id}`}
                    className="inline-block text-xs font-medium hover:underline"
                  >
                    Add task
                  </Link>
                ) : null}
                {hasPermission(ctx.permissions, "TIME_ENTRY_CREATE") ? (
                  <Link
                    href={`/time-tracking/new?projectId=${project.id}`}
                    className="inline-block text-xs font-medium hover:underline"
                  >
                    Log time
                  </Link>
                ) : null}
                {hasPermission(ctx.permissions, "EXPENSE_CREATE") ? (
                  <Link
                    href={`/expenses/new?projectId=${project.id}`}
                    className="inline-block text-xs font-medium hover:underline"
                  >
                    Submit expense
                  </Link>
                ) : null}
                {hasPermission(ctx.permissions, "CONTRACT_CREATE") ? (
                  <Link
                    href={`/contracts/new?projectId=${project.id}`}
                    className="inline-block text-xs font-medium hover:underline"
                  >
                    Create contract
                  </Link>
                ) : null}
                {hasPermission(ctx.permissions, "INVOICE_CREATE") ? (
                  <Link
                    href={`/invoices/new?projectId=${project.id}`}
                    className="inline-block text-xs font-medium hover:underline"
                  >
                    Create invoice
                  </Link>
                ) : null}
                {hasPermission(ctx.permissions, "BID_REQUEST_CREATE") ? (
                  <Link
                    href={`/bidding/requests/new?projectId=${project.id}`}
                    className="inline-block text-xs font-medium hover:underline"
                  >
                    Open bid request
                  </Link>
                ) : null}
              </>
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
