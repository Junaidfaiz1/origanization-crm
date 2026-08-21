"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { removeTeamMemberAction } from "@/modules/team/actions";

export function TeamDetailActions({
  memberId,
  canUpdate,
  canRemove,
}: {
  memberId: string;
  canUpdate: boolean;
  canRemove: boolean;
}) {
  if (!canUpdate && !canRemove) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canUpdate ? (
        <Button variant="outline" asChild>
          <Link href={`/team/${memberId}/edit`}>Edit role</Link>
        </Button>
      ) : null}
      {canRemove ? (
        <ConfirmDialog
          title="Remove from project?"
          description="This removes the resource from the project team. Their resource profile is kept."
          confirmLabel="Remove"
          destructive
          hiddenFields={{ id: memberId }}
          action={removeTeamMemberAction}
          trigger={
            <Button variant="outline" type="button">
              Remove
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
