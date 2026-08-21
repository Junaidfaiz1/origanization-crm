import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RequirementDetailActions } from "@/components/requirements/requirement-detail-actions";
import { getRequirement } from "@/modules/requirements/service";
import { isProjectClosed } from "@/modules/projects/rules";

export const metadata = { title: "Requirement" };

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to requirements"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const { id } = await params;

  let requirement;
  try {
    requirement = await getRequirement(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this requirement"
        description="Check the database connection and try again."
      />
    );
  }

  const projectOpen = !isProjectClosed(requirement.project.status);
  const canUpdate =
    hasPermission(ctx.permissions, "PROJECT_UPDATE") && projectOpen;
  const canDelete = canUpdate;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/requirements"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Requirements
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {requirement.title}
            </h1>
            <StatusBadge status={requirement.status} />
            <StatusBadge status={requirement.priority} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${requirement.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {requirement.project.name}
            </Link>
            {" · "}
            <Link
              href={`/clients/${requirement.project.clientId}`}
              className="hover:text-foreground hover:underline"
            >
              {requirement.project.clientName}
            </Link>
          </p>
        </div>
        <RequirementDetailActions
          requirementId={requirement.id}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Priority">
            <StatusBadge status={requirement.priority} />
          </Field>
          <Field label="Status">
            <StatusBadge status={requirement.status} />
          </Field>
          <Field label="Created">
            <DateDisplay value={requirement.createdAt} />
          </Field>
          <Field label="Updated">
            <DateDisplay value={requirement.updatedAt} />
          </Field>
          <Field
            label="Description"
            value={requirement.description}
            className="sm:col-span-2"
          />
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
