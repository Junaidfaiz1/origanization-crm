import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { formatDuration } from "@/modules/time-tracking/rules";
import type { SerializedTimeEntry } from "@/modules/time-tracking/service";

const columns: DataTableColumn<SerializedTimeEntry>[] = [
  {
    id: "when",
    header: "When",
    cell: (entry) => (
      <>
        <Link
          href={`/time-tracking/${entry.id}`}
          className="font-medium hover:underline"
        >
          <DateDisplay value={entry.startedAt} />
        </Link>
        {entry.running ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Running</p>
        ) : null}
      </>
    ),
  },
  {
    id: "person",
    header: "Person",
    className: "text-muted-foreground",
    cell: (entry) => entry.user.name,
  },
  {
    id: "project",
    header: "Project",
    cell: (entry) => (
      <Link
        href={`/projects/${entry.projectId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {entry.project.name}
      </Link>
    ),
  },
  {
    id: "task",
    header: "Task",
    className: "text-muted-foreground",
    cell: (entry) => entry.task?.title ?? "—",
  },
  {
    id: "duration",
    header: "Duration",
    cell: (entry) => formatDuration(entry.durationSeconds),
  },
  {
    id: "rate",
    header: "Rate",
    cell: (entry) =>
      entry.hourlyRate ? (
        <>
          <MoneyDisplay amount={entry.hourlyRate} />/hr
        </>
      ) : (
        "—"
      ),
  },
  {
    id: "billable",
    header: "Billable",
    cell: (entry) => (
      <StatusBadge status={entry.billable ? "ACTIVE" : "INACTIVE"} />
    ),
  },
];

export function TimeEntriesTable({ entries }: { entries: SerializedTimeEntry[] }) {
  return (
    <DataTable
      rows={entries}
      columns={columns}
      rowKey={(entry) => entry.id}
      caption="Time entries"
      minWidthClassName="min-w-[56rem]"
      mobileRow={(entry) => (
        <Link
          href={`/time-tracking/${entry.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{entry.project.name}</p>
              <p className="truncate text-sm text-muted-foreground">{entry.user.name}</p>
            </div>
            <span className="text-sm font-medium">{formatDuration(entry.durationSeconds)}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            <DateDisplay value={entry.startedAt} />
            {entry.running ? " · Running" : null}
          </p>
        </Link>
      )}
    />
  );
}
