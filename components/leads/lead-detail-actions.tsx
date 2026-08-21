"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveLeadAction, convertLeadAction } from "@/modules/leads/actions";

export function LeadDetailActions({
  leadId,
  canUpdate,
  canDelete,
  canConvert,
}: {
  leadId: string;
  canUpdate: boolean;
  canDelete: boolean;
  canConvert: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canConvert ? (
        <ConfirmDialog
          title="Convert this lead?"
          description="This creates a company, contact, client, and opportunity in one transaction. You cannot convert twice."
          confirmLabel="Convert lead"
          hiddenFields={{ id: leadId }}
          action={convertLeadAction}
          trigger={<Button>Convert to client</Button>}
        />
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Archive this lead?"
          description="The lead will be hidden from the list. Historical records stay intact."
          confirmLabel="Archive"
          destructive
          hiddenFields={{ id: leadId }}
          action={archiveLeadAction}
          trigger={
            <Button variant="outline" type="button">
              Archive
            </Button>
          }
        />
      ) : null}
      {canUpdate ? (
        <Button variant="outline" asChild>
          <Link href={`/leads/${leadId}/edit`}>Edit</Link>
        </Button>
      ) : null}
    </div>
  );
}
