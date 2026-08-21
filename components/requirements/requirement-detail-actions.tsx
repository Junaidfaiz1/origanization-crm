"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteRequirementAction } from "@/modules/requirements/actions";

export function RequirementDetailActions({
  requirementId,
  canUpdate,
  canDelete,
}: {
  requirementId: string;
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
          <Link href={`/requirements/${requirementId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this requirement?"
          description="This permanently removes the requirement from the project."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: requirementId }}
          action={deleteRequirementAction}
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
