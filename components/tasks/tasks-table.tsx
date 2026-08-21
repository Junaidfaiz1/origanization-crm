import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedTask } from "@/modules/tasks/service";

export function TasksTable({ tasks }: { tasks: SerializedTask[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/tasks/${task.id}`} className="font-medium hover:underline">
                    {task.title}
                  </Link>
                  {task.milestone ? (
                    <p className="mt-1 text-xs text-muted-foreground">{task.milestone.name}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${task.projectId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {task.project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {task.assignedTo?.name ?? "Unassigned"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.priority} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {task.dueDate ? <DateDisplay value={task.dueDate} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {tasks.map((task) => (
          <Link
            key={task.id}
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
        ))}
      </div>
    </>
  );
}
