import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedMilestone } from "@/modules/milestones/service";

const columns: DataTableColumn<SerializedMilestone>[] = [
  {
    id: "order",
    header: "#",
    className: "text-muted-foreground",
    cell: (milestone) => milestone.order,
  },
  {
    id: "milestone",
    header: "Milestone",
    cell: (milestone) => (
      <>
        <Link href={`/milestones/${milestone.id}`} className="font-medium hover:underline">
          {milestone.name}
        </Link>
        {milestone.taskCount > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">{milestone.taskCount} tasks</p>
        ) : null}
      </>
    ),
  },
  {
    id: "project",
    header: "Project",
    cell: (milestone) => (
      <Link
        href={`/projects/${milestone.projectId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {milestone.project.name}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (milestone) => <StatusBadge status={milestone.status} />,
  },
  {
    id: "amount",
    header: "Amount",
    cell: (milestone) => <MoneyDisplay amount={milestone.amount} />,
  },
  {
    id: "due",
    header: "Due",
    className: "text-muted-foreground",
    cell: (milestone) =>
      milestone.dueDate ? <DateDisplay value={milestone.dueDate} /> : "—",
  },
];

export function MilestonesTable({ milestones }: { milestones: SerializedMilestone[] }) {
  return (
    <DataTable
      rows={milestones}
      columns={columns}
      rowKey={(milestone) => milestone.id}
      caption="Milestones"
      minWidthClassName="min-w-[48rem]"
      mobileRow={(milestone) => (
        <Link
          href={`/milestones/${milestone.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {milestone.order}. {milestone.name}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {milestone.project.name}
              </p>
            </div>
            <StatusBadge status={milestone.status} />
          </div>
          <p className="mt-2 text-sm">
            <MoneyDisplay amount={milestone.amount} />
            {milestone.dueDate ? (
              <>
                {" · "}
                <DateDisplay value={milestone.dueDate} />
              </>
            ) : null}
          </p>
        </Link>
      )}
    />
  );
}
