import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedProject } from "@/modules/projects/service";

export function ProjectsTable({ projects }: { projects: SerializedProject[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Manager</th>
              <th className="px-4 py-3 font-medium">Timeline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${project.clientId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {project.client.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={project.budget} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {project.manager?.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {project.startDate ? <DateDisplay value={project.startDate} /> : "—"}
                  {project.endDate ? (
                    <>
                      {" → "}
                      <DateDisplay value={project.endDate} />
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{project.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {project.client.companyName}
                </p>
              </div>
              <StatusBadge status={project.status} />
            </div>
            <p className="mt-2 text-sm">
              <MoneyDisplay amount={project.budget} /> · {project.manager?.name ?? "Unassigned"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
