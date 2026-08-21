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
import { TeamDetailActions } from "@/components/team/team-detail-actions";
import { getTeamMember } from "@/modules/team/service";
import { isProjectClosed } from "@/modules/projects/rules";

export const metadata = { title: "Team assignment" };

export default async function TeamMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to project teams"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const { id } = await params;

  let member;
  try {
    member = await getTeamMember(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this assignment"
        description="Check the database connection and try again."
      />
    );
  }

  const projectOpen = !isProjectClosed(member.project.status);
  const canManage =
    hasPermission(ctx.permissions, "PROJECT_UPDATE") && projectOpen;
  const showRates = hasPermission(ctx.permissions, "RESOURCE_VIEW");
  const canViewResource = hasPermission(ctx.permissions, "RESOURCE_VIEW");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/team" className="text-sm text-muted-foreground hover:text-foreground">
            ← Team
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {member.resource.user.name}
            </h1>
            <StatusBadge status={member.resource.type} />
            <StatusBadge status={member.resource.availabilityStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${member.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {member.project.name}
            </Link>
            {" · "}
            <Link
              href={`/clients/${member.project.clientId}`}
              className="hover:text-foreground hover:underline"
            >
              {member.project.clientName}
            </Link>
          </p>
        </div>
        <TeamDetailActions
          memberId={member.id}
          canUpdate={canManage}
          canRemove={canManage}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" value={member.role} />
          <Field label="Assigned">
            <DateDisplay value={member.assignedAt} />
          </Field>
          <Field label="Email" value={member.resource.user.email} />
          {showRates ? (
            <Field label="Hourly rate">
              <MoneyDisplay amount={member.resource.hourlyRate} />
            </Field>
          ) : null}
          {canViewResource ? (
            <Field label="Resource profile" className="sm:col-span-2">
              <Link
                href={`/resources/${member.resourceId}`}
                className="font-medium hover:underline"
              >
                View resource
              </Link>
            </Field>
          ) : null}
        </CardContent>
      </Card>
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
