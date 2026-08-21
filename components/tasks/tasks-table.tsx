import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedTask } from "@/modules/tasks/service";

const columns: DataTableColumn<SerializedTask>[] = [
  {
    id: "task",
    header: "Task",
    cell: (task) => (
      <>
        <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
          {task.title}
        </Link>
        {task.milestone ? (
          <p className="mt-1 text-xs text-muted-foreground">{task.milestone.name}</p>
        ) : null}
      </>
    ),
  },
  {
    id: "project",
    header: "Project",
    cell: (task) => (
      <Link
        href={`/projects/${task.projectId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {task.project.name}
      </Link>
    ),
  },
  {
    id: "assignee",
    header: "Assignee",
    className: "text-muted-foreground",
    cell: (task) => task.assignedTo?.name ?? "Unassigned",
  },
  {
    id: "priority",
    header: "Priority",
    cell: (task) => <StatusBadge status={task.priority} />,
  },
  {
    id: "status",
    header: "Status",
    cell: (task) => <StatusBadge status={task.status} />,
  },
  {
    id: "due",
    header: "Due",
    className: "text-muted-foreground",
    cell: (task) => (task.dueDate ? <DateDisplay value={task.dueDate} /> : "—"),
  },
];

export function TasksTable({ tasks }: { tasks: SerializedTask[] }) {
  return (
    <DataTable
      rows={tasks}
      columns={columns}
      rowKey={(task) => task.id}
      caption="Tasks"
      minWidthClassName="min-w-[52rem]"
      mobileRow={(task) => (
        <Link
          href={`/tasks/${task.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{task.title}</p>
              <p className="truncate text-sm text-muted-foreground">{task.project.name}</p>
            </div>
            <StatusBadge status={task.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {task.assignedTo?.name ?? "Unassigned"}
            {" · "}
            <StatusBadge status={task.priority} />
            {task.dueDate ? (
              <>
                {" · "}
                <DateDisplay value={task.dueDate} />
              </>
            ) : null}
          </p>
        </Link>
      )}
    />
  );
}
