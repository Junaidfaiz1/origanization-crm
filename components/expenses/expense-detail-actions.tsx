"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  approveExpenseAction,
  deleteExpenseAction,
  rejectExpenseAction,
} from "@/modules/expenses/actions";

export function ExpenseDetailActions({
  expenseId,
  status,
  canUpdate,
  canReview,
  canDelete,
}: {
  expenseId: string;
  status: string;
  canUpdate: boolean;
  canReview: boolean;
  canDelete: boolean;
}) {
  if (!canUpdate && !canReview && !canDelete) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {canUpdate && status === "PENDING" ? (
        <Button variant="outline" asChild>
          <Link href={`/expenses/${expenseId}/edit`}>Edit</Link>
        </Button>
      ) : null}
      {canReview && status === "PENDING" ? (
        <>
          <form action={approveExpenseAction}>
            <input type="hidden" name="id" value={expenseId} />
            <Button type="submit">Approve</Button>
          </form>
          <form action={rejectExpenseAction}>
            <input type="hidden" name="id" value={expenseId} />
            <Button type="submit" variant="outline">
              Reject
            </Button>
          </form>
        </>
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          title="Delete this expense?"
          description="This permanently removes the expense submission."
          confirmLabel="Delete"
          destructive
          hiddenFields={{ id: expenseId }}
          action={deleteExpenseAction}
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
