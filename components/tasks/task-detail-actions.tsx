"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TASK_STATUSES } from "@/modules/tasks/rules";
import { deleteTaskAction, updateTaskStatusAction } from "@/modules/tasks/actions";

export function TaskDetailActions({
  taskId,
  currentStatus,
  canUpdate,
  canDelete,
}: {
  taskId: string;
  currentStatus: string;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  if (!canUpdate && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canUpdate ? (
        <>
          <Button variant="outline" asChild>
            <Link href={`/tasks/${taskId}/edit`}>Edit</Link>
          </Button>
          <form action={updateTaskStatusAction} className="inline-flex">
            <input type="hidden" name="id" value={taskId} />
            <select
              name="status"
              defaultValue={currentStatus}
              aria-label="Change status"
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              onChange={(event) => {
                event.currentTarget.form?.requestSubmit();
              }}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </form>
        </>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this task?"
          description="This permanently removes the task and its history from active views."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: taskId }}
          action={deleteTaskAction}
          trigger={
            <Button variant="outline" type="button">
              Delete
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
