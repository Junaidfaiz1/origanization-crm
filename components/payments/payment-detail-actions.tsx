"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { voidPaymentAction } from "@/modules/payments/actions";

export function PaymentDetailActions({
  paymentId,
  canVoid,
}: {
  paymentId: string;
  canVoid: boolean;
}) {
  if (!canVoid) {
    return null;
  }

  return (
    <ConfirmDialog
      title="Void this payment?"
      description="The payment will be marked refunded and the invoice balance will be restored."
      confirmLabel="Void payment"
      destructive
      hiddenFields={{ id: paymentId }}
      action={voidPaymentAction}
      trigger={
        <Button variant="outline" type="button">
          Void payment
        </Button>
      }
    />
  );
}
