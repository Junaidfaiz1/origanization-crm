import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/page";
import { listPortalProjects } from "@/modules/client-portal/service";
import { getProjectProgress } from "@/modules/progress/service";
import { toPublicProgress } from "@/modules/progress/rules";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProgressBar } from "@/components/progress/progress-bar";

export const metadata = { title: "Projects" };

export default async function PortalProjectsPage() {
  const ctx = await requirePortalUser();

  let projects;
  try {
    projects = await listPortalProjects(ctx);
  } catch {
    return <ErrorState title="Could not load projects" description="Try again shortly." />;
  }

  const progressRows = await Promise.all(
    projects.map(async (project) => {
      try {
        const progress = await getProjectProgress(ctx, project.id);
        return toPublicProgress(progress);
      } catch {
        return null;
      }
    }),
  );
  const progressById = new Map(
    progressRows
      .filter((row): row is NonNullable<typeof row> => row != null)
      .map((row) => [row.projectId, row]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track delivery progress and milestones. Internal bidding and costs are hidden.
        </p>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Accepted proposals become projects you can follow here."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Health</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {projects.map((project) => {
                  const progress = progressById.get(project.id);
                  return (
                    <tr key={project.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <Link
                          href={`/portal/projects/${project.id}`}
                          className="font-medium hover:underline"
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="min-w-[8rem] px-4 py-3">
                        <ProgressBar value={progress?.overallPercent ?? 0} />
                      </td>
                      <td className="px-4 py-3">
                        {progress ? <StatusBadge status={progress.health} /> : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {project.budget ? <MoneyDisplay amount={project.budget} /> : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={project.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {projects.map((project) => {
              const progress = progressById.get(project.id);
              return (
                <Link
                  key={project.id}
                  href={`/portal/projects/${project.id}`}
                  className="block rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate font-medium">{project.name}</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={progress?.overallPercent ?? 0} />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
