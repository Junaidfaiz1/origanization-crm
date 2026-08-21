import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EntityHeader, EntityTabs } from "@/components/shared/entity-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDetailActions } from "@/components/projects/project-detail-actions";
import { getProject } from "@/modules/projects/service";
import { getFileSummary } from "@/modules/files/service";
import { getProjectActivityPreview } from "@/modules/activity/service";
import { getProjectProgress } from "@/modules/progress/service";
import { isProjectClosed } from "@/modules/projects/rules";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { EmptyState } from "@/components/shared/empty-state";
import { ProjectProgressCard } from "@/components/progress/project-progress-card";
import { MetricCard } from "@/components/shared/metric-card";
import { CheckCircle2, Clock3, Target, Users } from "lucide-react";

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
  let fileSummary;
  let activity;
  let progress;
  try {
    project = await getProject(ctx, id);
    [fileSummary, activity, progress] = await Promise.all([
      getFileSummary(ctx, id),
      getProjectActivityPreview(ctx, id, 8),
      getProjectProgress(ctx, id),
    ]);
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

  const tabs = [
    { href: `/projects/${project.id}`, label: "Overview" },
    { href: `/progress?projectId=${project.id}`, label: "Progress" },
    { href: `/requirements?projectId=${project.id}`, label: "Requirements" },
    { href: `/tasks?projectId=${project.id}`, label: "Tasks" },
    { href: `/team?projectId=${project.id}`, label: "Team" },
    { href: `/files?projectId=${project.id}`, label: "Files" },
    { href: `/milestones?projectId=${project.id}`, label: "Milestones" },
    { href: `/activity?projectId=${project.id}`, label: "Activity" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <EntityHeader
        backHref="/projects"
        backLabel="Projects"
        title={project.name}
        status={project.status}
        description={project.client.companyName}
        meta={
          <span className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
            <Link
              href={`/clients/${project.clientId}`}
              className="hover:text-foreground hover:underline"
            >
              {project.client.companyName}
            </Link>
            {project.opportunity ? (
              <>
                <span aria-hidden>·</span>
                <Link
                  href={`/opportunities/${project.opportunity.id}`}
                  className="hover:text-foreground hover:underline"
                >
                  {project.opportunity.name}
                </Link>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>
              Created <DateDisplay value={project.createdAt} />
            </span>
          </span>
        }
        actions={
          <ProjectDetailActions
            projectId={project.id}
            canUpdate={canUpdate}
            canArchive={canArchive}
          />
        }
      />

      <EntityTabs items={tabs} activeHref={`/projects/${project.id}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="Progress"
          value={`${Math.round(progress.overallPercent)}%`}
          hint={progress.health.replaceAll("_", " ").toLowerCase()}
          icon={Target}
          href={`/progress?projectId=${project.id}`}
        />
        <MetricCard
          title="Tasks"
          value={`${progress.tasks.done}/${progress.tasks.total}`}
          hint="Completed"
          icon={CheckCircle2}
          href={`/tasks?projectId=${project.id}`}
        />
        <MetricCard
          title="Team"
          value={String(project.memberCount)}
          hint="Assigned members"
          icon={Users}
          href={`/team?projectId=${project.id}`}
        />
        <MetricCard
          title="Deadline"
          value={
            project.endDate ? (
              <DateDisplay value={project.endDate} />
            ) : (
              "—"
            )
          }
          hint="Target end date"
          icon={Clock3}
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
              {project.startDate ? (
                <DateDisplay value={project.startDate} />
              ) : (
                "—"
              )}
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
            <Field
              label="Description"
              value={project.description}
              className="sm:col-span-2"
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <ProjectProgressCard progress={progress} href="/progress" />

          <Card>
            <CardHeader>
              <CardTitle>Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DeliveryLink
                label="Bid requests"
                href={`/bidding?projectId=${project.id}`}
                value={project.bidRequestCount}
              />
              <DeliveryLink
                label="Requirements"
                href={`/requirements?projectId=${project.id}`}
                value={project.requirementCount}
              />
              <DeliveryLink
                label="Files"
                href={`/files?projectId=${project.id}`}
                value={fileSummary.total}
              />
              <DeliveryLink
                label="Milestones"
                href={`/milestones?projectId=${project.id}`}
                value={project.milestoneCount}
              />
              <DeliveryLink
                label="Tasks"
                href={`/tasks?projectId=${project.id}`}
                value={project.taskCount}
              />
              <DeliveryLink
                label="Team"
                href={`/team?projectId=${project.id}`}
                value={project.memberCount}
              />
              {hasPermission(ctx.permissions, "TIME_ENTRY_VIEW") ? (
                <DeliveryLink
                  label="Time logged"
                  href={`/time-tracking?projectId=${project.id}`}
                  value="View"
                />
              ) : null}
              {canManageMilestones ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-caption">
                  <Link
                    href={`/requirements/new?projectId=${project.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Add requirement
                  </Link>
                  <Link
                    href={`/team/new?projectId=${project.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    Assign member
                  </Link>
                  {hasPermission(ctx.permissions, "TASK_CREATE") ? (
                    <Link
                      href={`/tasks/new?projectId=${project.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Add task
                    </Link>
                  ) : null}
                  {hasPermission(ctx.permissions, "BID_REQUEST_CREATE") ? (
                    <Link
                      href={`/bidding/requests/new?projectId=${project.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      Open bid request
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h3">Activity</h2>
          <Link
            href={`/activity?projectId=${project.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {activity.length === 0 ? (
          <EmptyState
            title="No project activity yet"
            description="Updates to this project, its tasks, bids, and invoices will appear here."
          />
        ) : (
          <ActivityFeed items={activity} />
        )}
      </div>
    </div>
  );
}

function DeliveryLink({
  label,
  href,
  value,
}: {
  label: string;
  href: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <Link href={href} className="font-medium hover:underline">
        {value}
      </Link>
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
      <p className="text-caption text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children ?? value ?? "—"}</div>
    </div>
  );
}
