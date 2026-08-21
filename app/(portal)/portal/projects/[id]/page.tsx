import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortalUser } from "@/lib/auth/page";
import { NotFoundError } from "@/lib/errors/app-error";
import { getPortalProject } from "@/modules/client-portal/service";
import { getProjectProgress } from "@/modules/progress/service";
import { toPublicProgress } from "@/modules/progress/rules";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectProgressCard } from "@/components/progress/project-progress-card";

export const metadata = { title: "Project" };

export default async function PortalProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requirePortalUser();
  const { id } = await params;

  let project;
  let progress;
  try {
    project = await getPortalProject(ctx, id);
    progress = toPublicProgress(await getProjectProgress(ctx, id));
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    return <ErrorState title="Could not load project" description="Try again shortly." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/portal/projects"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Projects
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
        ) : null}
      </div>

      <ProjectProgressCard progress={progress} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="mt-1 font-semibold">
              {project.budget ? <MoneyDisplay amount={project.budget} /> : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Start</p>
            <p className="mt-1 font-semibold">
              {project.startDate ? <DateDisplay value={project.startDate} /> : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">End</p>
            <p className="mt-1 font-semibold">
              {project.endDate ? <DateDisplay value={project.endDate} /> : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {project.milestones.length === 0 ? (
            <EmptyState
              title="No milestones yet"
              description="Milestones will appear as the agency plans delivery."
            />
          ) : (
            <div className="space-y-3">
              {project.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {milestone.order}. {milestone.name}
                    </p>
                    {milestone.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                    ) : null}
                    {milestone.dueDate ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due <DateDisplay value={milestone.dueDate} />
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3">
                    {milestone.amount ? (
                      <MoneyDisplay amount={milestone.amount} />
                    ) : null}
                    <StatusBadge status={milestone.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
