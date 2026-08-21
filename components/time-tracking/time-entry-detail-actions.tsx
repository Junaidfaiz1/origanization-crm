"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteTimeEntryAction, stopTimerAction } from "@/modules/time-tracking/actions";

export function TimeEntryDetailActions({
  entryId,
  running,
  canUpdate,
  canDelete,
}: {
  entryId: string;
  running: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  if (!canUpdate && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canUpdate && !running ? (
        <Button variant="outline" asChild>
          <Link href={`/time-tracking/${entryId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canUpdate && running ? (
        <form action={stopTimerAction}>
          <input type="hidden" name="id" value={entryId} />
          <Button type="submit">Stop timer</Button>
        </form>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this time entry?"
          description="This permanently removes the logged time."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: entryId }}
          action={deleteTimeEntryAction}
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
