import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDuration } from "@/modules/time-tracking/rules";
import type { SerializedTimeEntry } from "@/modules/time-tracking/service";

export function TimeEntriesTable({ entries }: { entries: SerializedTimeEntry[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Duration</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Billable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/time-tracking/${entry.id}`}
                    className="font-medium hover:underline"
                  >
                    <DateDisplay value={entry.startedAt} />
                  </Link>
                  {entry.running ? (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Running</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{entry.user.name}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${entry.projectId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {entry.project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.task?.title ?? "—"}
                </td>
                <td className="px-4 py-3">{formatDuration(entry.durationSeconds)}</td>
                <td className="px-4 py-3">
                  {entry.hourlyRate ? (
                    <>
                      <MoneyDisplay amount={entry.hourlyRate} />/hr
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={entry.billable ? "ACTIVE" : "INACTIVE"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {entries.map((entry) => (
          <Link
            key={entry.id}
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
        ))}
      </div>
    </>
  );
}
