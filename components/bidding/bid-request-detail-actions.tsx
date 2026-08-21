"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  cancelBidRequestAction,
  closeBidRequestAction,
  openBidRequestAction,
  pauseBidRequestAction,
} from "@/modules/bidding/actions";

export function BidRequestDetailActions({
  requestId,
  status,
  canEdit,
  canOpen,
  canPause,
  canClose,
  canCancel,
}: {
  requestId: string;
  status: string;
  canEdit: boolean;
  canOpen: boolean;
  canPause: boolean;
  canClose: boolean;
  canCancel: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canEdit && status === "DRAFT" ? (
        <Button variant="outline" asChild>
          <Link href={`/bidding/requests/${requestId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canOpen ? (
        <form action={openBidRequestAction}>
          <input type="hidden" name="id" value={requestId} />
          <Button type="submit">Open bidding</Button>
        </form>
      ) : null}
      {canPause ? (
        <form action={pauseBidRequestAction}>
          <input type="hidden" name="id" value={requestId} />
          <Button type="submit" variant="outline">
            Pause
          </Button>
        </form>
      ) : null}
      {canClose ? (
        <ConfirmDialog
          title="Close this bid request?"
          description="No new bids can be submitted after closing."
          confirmLabel="Close"
          hiddenFields={{ id: requestId }}
          action={closeBidRequestAction}
          trigger={
            <Button variant="outline" type="button">
              Close
            </Button>
          }
        />
      ) : null}
      {canCancel ? (
        <ConfirmDialog
          title="Cancel this bid request?"
          description="The request will be cancelled. Existing bids stay for history."
          confirmLabel="Cancel request"
          destructive
          hiddenFields={{ id: requestId }}
          action={cancelBidRequestAction}
          trigger={
            <Button variant="outline" type="button">
              Cancel
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
