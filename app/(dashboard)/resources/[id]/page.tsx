import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceDetailActions } from "@/components/resources/resource-detail-actions";
import { getResource } from "@/modules/resources/service";

export const metadata = { title: "Resource" };

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "RESOURCE_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to resources"
        description="Ask an owner or project manager to grant RESOURCE_VIEW."
      />
    );
  }

  const { id } = await params;

  let resource;
  try {
    resource = await getResource(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this resource"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpdate = hasPermission(ctx.permissions, "RESOURCE_UPDATE");
  const canDelete =
    hasPermission(ctx.permissions, "RESOURCE_DELETE") &&
    resource.projectCount === 0 &&
    resource.contractCount === 0 &&
    resource.bidCount === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/resources" className="text-sm text-muted-foreground hover:text-foreground">
            ← Resources
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {resource.user.name}
            </h1>
            <StatusBadge status={resource.type} />
            <StatusBadge status={resource.availabilityStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{resource.user.email}</p>
        </div>
        <ResourceDetailActions
          resourceId={resource.id}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Hourly rate">
              {resource.hourlyRate ? <MoneyDisplay amount={resource.hourlyRate} /> : "—"}
            </Field>
            <Field label="Experience">
              {resource.experienceYears != null ? `${resource.experienceYears} years` : "—"}
            </Field>
            <Field label="Rating">{resource.rating ?? "—"}</Field>
            <Field label="Created">
              <DateDisplay value={resource.createdAt} />
            </Field>
            <Field label="Updated">
              <DateDisplay value={resource.updatedAt} />
            </Field>
            <Field label="Bio" value={resource.bio} className="sm:col-span-2" />
            <Field label="Skills" className="sm:col-span-2">
              {resource.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resource.skills.map((skill) => (
                    <Badge key={skill.id}>{skill.name}</Badge>
                  ))}
                </div>
              ) : (
                "—"
              )}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Projects</span>
              <span className="font-medium">{resource.projectCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contracts</span>
              <span className="font-medium">{resource.contractCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bids</span>
              <span className="font-medium">{resource.bidCount}</span>
            </div>
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
