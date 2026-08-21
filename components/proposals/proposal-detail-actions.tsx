"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  acceptProposalAction,
  archiveProposalAction,
  rejectProposalAction,
  sendProposalAction,
} from "@/modules/proposals/actions";

export function ProposalDetailActions({
  proposalId,
  canEdit,
  canSend,
  canAccept,
  canReject,
  canArchive,
}: {
  proposalId: string;
  canEdit: boolean;
  canSend: boolean;
  canAccept: boolean;
  canReject: boolean;
  canArchive: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
      {canEdit ? (
        <Button variant="outline" asChild>
          <Link href={`/proposals/${proposalId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canSend ? (
        <ConfirmDialog
          title="Send this proposal?"
          description="The proposal status will move from draft to sent."
          confirmLabel="Send"
          hiddenFields={{ id: proposalId }}
          action={sendProposalAction}
          trigger={
            <Button variant="outline" type="button">
              Send
            </Button>
          }
        />
      ) : null}
      {canAccept ? (
        <ConfirmDialog
          title="Accept this proposal?"
          description="This will mark the deal won and create a linked project."
          confirmLabel="Accept"
          hiddenFields={{ id: proposalId }}
          action={acceptProposalAction}
          trigger={<Button type="button">Accept</Button>}
        />
      ) : null}
      {canReject ? (
        <ConfirmDialog
          title="Reject this proposal?"
          description="The proposal will be marked rejected and can no longer be accepted."
          confirmLabel="Reject"
          destructive
          hiddenFields={{ id: proposalId }}
          action={rejectProposalAction}
          trigger={
            <Button variant="outline" type="button">
              Reject
            </Button>
          }
        />
      ) : null}
      {canArchive ? (
        <ConfirmDialog
          title="Archive this proposal?"
          description="The proposal will be hidden from lists. History stays intact."
          confirmLabel="Archive"
          destructive
          hiddenFields={{ id: proposalId }}
          action={archiveProposalAction}
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
