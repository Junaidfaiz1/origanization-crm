"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveContactAction } from "@/modules/contacts/actions";

export function ContactDetailActions({
  contactId,
  canUpdate,
  canArchive,
}: {
  contactId: string;
  canUpdate: boolean;
  canArchive: boolean;
}) {
  if (!canUpdate) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="outline" asChild>
        <Link href={`/contacts/${contactId}/edit`}>Edit</Link>
      </Button>
      {canArchive ? (
        <ConfirmDialog
          title="Archive this contact?"
          description="The contact will be hidden from lists. Client records that use this person as primary contact must be updated first."
          confirmLabel="Archive"
          destructive
          hiddenFields={{ id: contactId }}
          action={archiveContactAction}
          trigger={
            <Button variant="outline" type="button">
              Archive
            </Button>
          }
        />
      ) : (
        <p className="text-xs text-muted-foreground sm:self-center">
          Primary contact for an active client — reassign before archiving.
        </p>
      )}
    </div>
  );
}
