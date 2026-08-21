"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  deleteContractAction,
  updateContractStatusAction,
} from "@/modules/contracts/actions";

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  DRAFT: { status: "SENT", label: "Mark sent" },
  SENT: { status: "SIGNED", label: "Mark signed" },
  SIGNED: { status: "ACTIVE", label: "Activate" },
  ACTIVE: { status: "COMPLETED", label: "Complete" },
};

export function ContractDetailActions({
  contractId,
  status,
  canUpdate,
  canManageStatus,
  canDelete,
}: {
  contractId: string;
  status: string;
  canUpdate: boolean;
  canManageStatus: boolean;
  canDelete: boolean;
}) {
  const next = NEXT_STATUS[status];
  const canCancel = canManageStatus && !["COMPLETED", "CANCELLED"].includes(status);

  if (!canUpdate && !canManageStatus && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canUpdate ? (
        <Button variant="outline" asChild>
          <Link href={`/contracts/${contractId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canManageStatus && next ? (
        <form action={updateContractStatusAction}>
          <input type="hidden" name="id" value={contractId} />
          <input type="hidden" name="status" value={next.status} />
          <Button type="submit">{next.label}</Button>
        </form>
      ) : null}
      {canCancel ? (
        <form action={updateContractStatusAction}>
          <input type="hidden" name="id" value={contractId} />
          <input type="hidden" name="status" value="CANCELLED" />
          <Button type="submit" variant="outline">
            Cancel contract
          </Button>
        </form>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this contract?"
          description="This permanently removes the draft contract."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: contractId }}
          action={deleteContractAction}
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
