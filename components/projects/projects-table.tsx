import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedProject } from "@/modules/projects/service";

const columns: DataTableColumn<SerializedProject>[] = [
  {
    id: "project",
    header: "Project",
    cell: (project) => (
      <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
        {project.name}
      </Link>
    ),
  },
  {
    id: "client",
    header: "Client",
    cell: (project) => (
      <Link
        href={`/clients/${project.clientId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {project.client.companyName}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (project) => <StatusBadge status={project.status} />,
  },
  {
    id: "budget",
    header: "Budget",
    cell: (project) => <MoneyDisplay amount={project.budget} />,
  },
  {
    id: "manager",
    header: "Manager",
    className: "text-muted-foreground",
    cell: (project) => project.manager?.name ?? "—",
  },
  {
    id: "timeline",
    header: "Timeline",
    className: "text-muted-foreground",
    cell: (project) => (
      <>
        {project.startDate ? <DateDisplay value={project.startDate} /> : "—"}
        {project.endDate ? (
          <>
            {" → "}
            <DateDisplay value={project.endDate} />
          </>
        ) : null}
      </>
    ),
  },
];

export function ProjectsTable({ projects }: { projects: SerializedProject[] }) {
  return (
    <DataTable
      rows={projects}
      columns={columns}
      rowKey={(project) => project.id}
      caption="Projects"
      minWidthClassName="min-w-[48rem]"
      mobileRow={(project) => (
        <Link
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
      )}
    />
  );
}
