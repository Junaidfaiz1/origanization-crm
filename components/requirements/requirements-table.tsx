import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedRequirement } from "@/modules/requirements/service";

const columns: DataTableColumn<SerializedRequirement>[] = [
  {
    id: "requirement",
    header: "Requirement",
    cell: (requirement) => (
      <Link
        href={`/requirements/${requirement.id}`}
        className="font-medium hover:underline"
      >
        {requirement.title}
      </Link>
    ),
  },
  {
    id: "project",
    header: "Project",
    cell: (requirement) => (
      <Link
        href={`/projects/${requirement.projectId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {requirement.project.name}
      </Link>
    ),
  },
  {
    id: "priority",
    header: "Priority",
    cell: (requirement) => <StatusBadge status={requirement.priority} />,
  },
  {
    id: "status",
    header: "Status",
    cell: (requirement) => <StatusBadge status={requirement.status} />,
  },
  {
    id: "updated",
    header: "Updated",
    className: "text-muted-foreground",
    cell: (requirement) => <DateDisplay value={requirement.updatedAt} />,
  },
];

export function RequirementsTable({
  requirements,
}: {
  requirements: SerializedRequirement[];
}) {
  return (
    <DataTable
      rows={requirements}
      columns={columns}
      rowKey={(requirement) => requirement.id}
      caption="Requirements"
      minWidthClassName="min-w-[48rem]"
      mobileRow={(requirement) => (
        <Link
          href={`/requirements/${requirement.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{requirement.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {requirement.project.name}
              </p>
            </div>
            <StatusBadge status={requirement.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            <StatusBadge status={requirement.priority} />
          </p>
        </Link>
      )}
    />
  );
}
