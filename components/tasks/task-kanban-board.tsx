"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { TASK_STATUSES } from "@/modules/tasks/rules";
import { updateTaskStatusKanbanAction } from "@/modules/tasks/actions";
import type { SerializedTask } from "@/modules/tasks/service";

type KanbanBoard = {
  columns: Array<{ status: string; tasks: SerializedTask[] }>;
  totalCount: number;
};

const selectClassName =
  "mt-2 w-full rounded-md border border-input bg-card px-2 py-1 text-xs shadow-xs outline-none focus-visible:border-ring";

export function TaskKanbanBoard({
  board,
  canUpdate,
}: {
  board: KanbanBoard;
  canUpdate: boolean;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-4">
        {board.columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            tasks={column.tasks}
            canUpdate={canUpdate}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  canUpdate,
}: {
  status: string;
  tasks: SerializedTask[];
  canUpdate: boolean;
}) {
  return (
    <div className="w-72 shrink-0 rounded-xl border border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <StatusBadge status={status} />
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="space-y-2 p-2">
        {tasks.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">No tasks</p>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} canUpdate={canUpdate} />
          ))
        )}
      </div>
    </div>
  );
}

function KanbanCard({ task, canUpdate }: { task: SerializedTask; canUpdate: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={`rounded-lg border border-border bg-card p-3 shadow-xs ${pending ? "opacity-60" : ""}`}
    >
      <Link href={`/tasks/${task.id}`} className="block font-medium hover:underline">
        {task.title}
      </Link>
      <p className="mt-1 truncate text-xs text-muted-foreground">{task.project.name}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={task.priority} />
        {task.dueDate ? (
          <span className="text-xs text-muted-foreground">
            <DateDisplay value={task.dueDate} />
          </span>
        ) : null}
      </div>
      {task.assignedTo ? (
        <p className="mt-2 text-xs text-muted-foreground">{task.assignedTo.name}</p>
      ) : null}
      {canUpdate ? (
        <select
          aria-label={`Move ${task.title}`}
          className={selectClassName}
          value={task.status}
          disabled={pending}
          onChange={(event) => {
            const formData = new FormData();
            formData.set("id", task.id);
            formData.set("status", event.target.value);
            startTransition(async () => {
              await updateTaskStatusKanbanAction(formData);
              router.refresh();
            });
          }}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
