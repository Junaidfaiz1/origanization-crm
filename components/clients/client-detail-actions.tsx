"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveClientAction } from "@/modules/clients/actions";

export function ClientDetailActions({
  clientId,
  canUpdate,
  canArchive,
}: {
  clientId: string;
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
          <Link href={`/clients/${clientId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canArchive ? (
        <ConfirmDialog
          title="Archive this client?"
          description="The client will be hidden from lists. Opportunities, projects, invoices, and history stay intact."
          confirmLabel="Archive"
          destructive
          hiddenFields={{ id: clientId }}
          action={archiveClientAction}
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
