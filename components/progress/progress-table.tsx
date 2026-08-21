import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { DateDisplay } from "@/components/shared/date-display";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ProgressBar } from "@/components/progress/progress-bar";
import type { SerializedProjectProgress } from "@/modules/progress/service";

const columns: DataTableColumn<SerializedProjectProgress>[] = [
  {
    id: "project",
    header: "Project",
    cell: (row) => (
      <>
        <Link
          href={`/projects/${row.projectId}`}
          className="font-medium hover:underline"
        >
          {row.name}
        </Link>
        <p className="text-xs text-muted-foreground">{row.clientName}</p>
      </>
    ),
  },
  {
    id: "health",
    header: "Health",
    cell: (row) => <StatusBadge status={row.health} />,
  },
  {
    id: "overall",
    header: "Overall",
    cell: (row) => <ProgressBar value={row.overallPercent} />,
  },
  {
    id: "delivery",
    header: "Delivery",
    className: "text-muted-foreground",
    cell: (row) => (
      <>
        Milestones {row.milestones.completed}/{row.milestones.total}
        <br />
        Tasks {row.tasks.done}/{row.tasks.total}
      </>
    ),
  },
  {
    id: "end",
    header: "End date",
    className: "text-muted-foreground",
    cell: (row) =>
      row.endDate ? <DateDisplay value={row.endDate} /> : "—",
  },
];

export function ProgressTable({
  rows,
}: {
  rows: SerializedProjectProgress[];
}) {
  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.projectId}
      caption="Project progress"
      mobileRow={(row) => (
        <Link
          href={`/projects/${row.projectId}`}
          className="block space-y-2 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{row.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.clientName}
              </p>
            </div>
            <StatusBadge status={row.health} />
          </div>
          <ProgressBar value={row.overallPercent} />
        </Link>
      )}
    />
  );
}
