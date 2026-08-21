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
import { MilestoneDetailActions } from "@/components/milestones/milestone-detail-actions";
import { getMilestone } from "@/modules/milestones/service";
import { isProjectClosed } from "@/modules/projects/rules";

export const metadata = { title: "Milestone" };

export default async function MilestoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to milestones"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const { id } = await params;

  let milestone;
  try {
    milestone = await getMilestone(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this milestone"
        description="Check the database connection and try again."
      />
    );
  }

  const projectOpen = !isProjectClosed(milestone.project.status);
  const canUpdate =
    hasPermission(ctx.permissions, "PROJECT_UPDATE") && projectOpen;
  const canDelete =
    hasPermission(ctx.permissions, "PROJECT_UPDATE") &&
    projectOpen &&
    milestone.taskCount === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/milestones" className="text-sm text-muted-foreground hover:text-foreground">
            ← Milestones
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {milestone.name}
            </h1>
            <StatusBadge status={milestone.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${milestone.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {milestone.project.name}
            </Link>
            {" · "}
            <Link
              href={`/clients/${milestone.project.clientId}`}
              className="hover:text-foreground hover:underline"
            >
              {milestone.project.clientName}
            </Link>
            {" · Order "}
            {milestone.order}
          </p>
        </div>
        <MilestoneDetailActions
          milestoneId={milestone.id}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <MoneyDisplay amount={milestone.amount} />
            </Field>
            <Field label="Due date">
              {milestone.dueDate ? <DateDisplay value={milestone.dueDate} /> : "—"}
            </Field>
            <Field label="Created">
              <DateDisplay value={milestone.createdAt} />
            </Field>
            <Field label="Updated">
              <DateDisplay value={milestone.updatedAt} />
            </Field>
            <Field label="Description" value={milestone.description} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tasks</span>
              <Link
                href={`/tasks?projectId=${milestone.projectId}&milestoneId=${milestone.id}`}
                className="font-medium hover:underline"
              >
                {milestone.taskCount}
              </Link>
            </div>
            {milestone.taskCount > 0 ? (
              <Link
                href={`/tasks?projectId=${milestone.projectId}`}
                className="inline-block text-xs font-medium hover:underline"
              >
                View project tasks
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
