"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteMilestoneAction } from "@/modules/milestones/actions";

export function MilestoneDetailActions({
  milestoneId,
  canUpdate,
  canDelete,
}: {
  milestoneId: string;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  if (!canUpdate && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canUpdate ? (
        <Button variant="outline" asChild>
          <Link href={`/milestones/${milestoneId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this milestone?"
          description="This permanently removes the milestone. Linked tasks must be reassigned first."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: milestoneId }}
          action={deleteMilestoneAction}
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
