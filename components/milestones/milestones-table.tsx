import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedMilestone } from "@/modules/milestones/service";

export function MilestonesTable({ milestones }: { milestones: SerializedMilestone[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Milestone</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {milestones.map((milestone) => (
              <tr key={milestone.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 text-muted-foreground">{milestone.order}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/milestones/${milestone.id}`}
                    className="font-medium hover:underline"
                  >
                    {milestone.name}
                  </Link>
                  {milestone.taskCount > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {milestone.taskCount} tasks
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${milestone.projectId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {milestone.project.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={milestone.status} />
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={milestone.amount} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {milestone.dueDate ? <DateDisplay value={milestone.dueDate} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {milestones.map((milestone) => (
          <Link
            key={milestone.id}
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
        ))}
      </div>
    </>
  );
}
