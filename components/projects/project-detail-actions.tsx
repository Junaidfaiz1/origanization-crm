"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveProjectAction } from "@/modules/projects/actions";

export function ProjectDetailActions({
  projectId,
  canUpdate,
  canArchive,
}: {
  projectId: string;
  canUpdate: boolean;
  canArchive: boolean;
}) {
  if (!canUpdate && !canArchive) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canUpdate ? (
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canArchive ? (
        <ConfirmDialog
          title="Archive this project?"
          description="The project will be hidden from lists. History, bids, and invoices stay intact."
          confirmLabel="Archive"
          destructive
          hiddenFields={{ id: projectId }}
          action={archiveProjectAction}
          trigger={
            <Button variant="outline" type="button">
              Archive
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
