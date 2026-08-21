"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteResourceAction } from "@/modules/resources/actions";

export function ResourceDetailActions({
  resourceId,
  canUpdate,
  canDelete,
}: {
  resourceId: string;
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
          <Link href={`/resources/${resourceId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this resource profile?"
          description="This permanently removes the profile. Remove project assignments, contracts, and bids first."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: resourceId }}
          action={deleteResourceAction}
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
