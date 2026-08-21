"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import { recordPaymentSchema } from "@/modules/payments/validation";
import { recordPayment, voidPayment } from "@/modules/payments/service";
import { logger } from "@/lib/logging/logger";

export type PaymentFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function revalidatePaymentPaths(invoiceId: string, paymentId?: string) {
  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  if (paymentId) {
    revalidatePath(`/payments/${paymentId}`);
  }
}

export async function recordPaymentAction(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PAYMENT_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = recordPaymentSchema.safeParse({
    invoiceId: formValue(formData, "invoiceId"),
    amount: formValue(formData, "amount"),
    currency: formValue(formData, "currency") || "USD",
    method: formValue(formData, "method"),
    reference: formValue(formData, "reference"),
    paidAt: formValue(formData, "paidAt"),
    notes: formValue(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const payment = await recordPayment(actor, parsed.data);
    revalidatePaymentPaths(payment.invoiceId, payment.id);
    redirect(`/payments/${payment.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Record payment failed", { operation: "payment.record", error });
    return { message: "Unable to record this payment. Try again." };
  }
}

export async function voidPaymentAction(formData: FormData) {
  const actor = await requirePagePermission("PAYMENT_UPDATE");
  const id = formValue(formData, "id");
  const payment = await voidPayment(actor, id);
  revalidatePaymentPaths(payment.invoiceId, payment.id);
  redirect(`/payments/${payment.id}`);
}
