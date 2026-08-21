"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  cancelInvoiceAction,
  deleteInvoiceAction,
  markInvoiceOverdueAction,
  sendInvoiceAction,
} from "@/modules/invoices/actions";

export function InvoiceDetailActions({
  invoiceId,
  canEdit,
  canSend,
  canCancel,
  canMarkOverdue,
  canDelete,
  canRecordPayment,
}: {
  invoiceId: string;
  canEdit: boolean;
  canSend: boolean;
  canCancel: boolean;
  canMarkOverdue: boolean;
  canDelete: boolean;
  canRecordPayment?: boolean;
}) {
  if (
    !canEdit &&
    !canSend &&
    !canCancel &&
    !canMarkOverdue &&
    !canDelete &&
    !canRecordPayment
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canEdit ? (
        <Button variant="outline" asChild>
          <Link href={`/invoices/${invoiceId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canSend ? (
        <ConfirmDialog
          title="Send this invoice?"
          description="The invoice status will move from draft to sent."
          confirmLabel="Send"
          hiddenFields={{ id: invoiceId }}
          action={sendInvoiceAction}
          trigger={<Button type="button">Send</Button>}
        />
      ) : null}
      {canRecordPayment ? (
        <Button asChild>
          <Link href={`/payments/new?invoiceId=${invoiceId}`}>Record payment</Link>
        </Button>
      ) : null}
      {canMarkOverdue ? (
        <form action={markInvoiceOverdueAction}>
          <input type="hidden" name="id" value={invoiceId} />
          <Button type="submit" variant="outline">
            Mark overdue
          </Button>
        </form>
      ) : null}
      {canCancel ? (
        <ConfirmDialog
          title="Cancel this invoice?"
          description="Cancelled invoices stay in history but cannot be paid."
          confirmLabel="Cancel invoice"
          destructive
          hiddenFields={{ id: invoiceId }}
          action={cancelInvoiceAction}
          trigger={
            <Button variant="outline" type="button">
              Cancel
            </Button>
          }
        />
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this invoice?"
          description="This permanently removes the draft invoice and its line items."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: invoiceId }}
          action={deleteInvoiceAction}
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
