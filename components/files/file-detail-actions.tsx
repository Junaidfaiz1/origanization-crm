"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deleteFileAction } from "@/modules/files/actions";

export function FileDetailActions({
  fileId,
  downloadUrl,
  canDelete,
}: {
  fileId: string;
  downloadUrl: string;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button asChild>
        <a href={downloadUrl} target="_blank" rel="noreferrer">
          Download
        </a>
      </Button>
      {canDelete ? (
        <ConfirmDialog
          title="Delete this file?"
          description="This removes the file metadata and storage object."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: fileId }}
          action={deleteFileAction}
          trigger={
            <Button variant="outline" type="button">
              Delete
            </Button>
          }
        />
      ) : null}
      <Button variant="outline" asChild>
        <Link href="/files">Back</Link>
      </Button>
    </div>
  );
}
