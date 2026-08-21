"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createInvoiceSchema,
  invoiceItemSchema,
  updateInvoiceSchema,
} from "@/modules/invoices/validation";
import {
  cancelInvoice,
  createInvoice,
  deleteInvoice,
  markInvoiceOverdue,
  sendInvoice,
  updateInvoice,
} from "@/modules/invoices/service";
import { logger } from "@/lib/logging/logger";

export type InvoiceFormState = {
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

function parseItems(raw: string) {
  if (!raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const items = [];
    for (const entry of parsed) {
      const result = invoiceItemSchema.safeParse(entry);
      if (!result.success) {
        return null;
      }
      items.push(result.data);
    }
    return items;
  } catch {
    return null;
  }
}

function invoicePayload(formData: FormData) {
  const items = parseItems(formValue(formData, "itemsJson"));
  return {
    payload: {
      clientId: formValue(formData, "clientId"),
      projectId: formValue(formData, "projectId"),
      discount: formValue(formData, "discount"),
      tax: formValue(formData, "tax"),
      currency: formValue(formData, "currency") || "USD",
      issueDate: formValue(formData, "issueDate"),
      dueDate: formValue(formData, "dueDate"),
      notes: formValue(formData, "notes"),
      items,
    },
    itemsError: items === null,
  };
}

function revalidateInvoicePaths(projectId: string | null, invoiceId?: string) {
  revalidatePath("/invoices");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  if (invoiceId) {
    revalidatePath(`/invoices/${invoiceId}`);
  }
}

export async function createInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  let actor;
  try {
    actor = await requirePagePermission("INVOICE_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const { payload, itemsError } = invoicePayload(formData);
  if (itemsError || !payload.items?.length) {
    return {
      message: "Add at least one valid line item.",
      errors: { items: ["Each item needs a description, quantity, and unit price."] },
    };
  }

  const parsed = createInvoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const invoice = await createInvoice(actor, parsed.data);
    revalidateInvoicePaths(invoice.projectId, invoice.id);
    redirect(`/invoices/${invoice.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Create invoice failed", { operation: "invoice.create", error });
    return { message: "Unable to create this invoice. Try again." };
  }
}

export async function updateInvoiceAction(
  _prev: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  let actor;
  try {
    actor = await requirePagePermission("INVOICE_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Invoice id is required." };

  const { payload, itemsError } = invoicePayload(formData);
  if (itemsError || !payload.items?.length) {
    return {
      message: "Add at least one valid line item.",
      errors: { items: ["Each item needs a description, quantity, and unit price."] },
    };
  }

  const parsed = updateInvoiceSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const invoice = await updateInvoice(actor, id, parsed.data);
    revalidateInvoicePaths(invoice.projectId, invoice.id);
    redirect(`/invoices/${invoice.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update invoice failed", { operation: "invoice.update", error });
    return { message: "Unable to update this invoice. Try again." };
  }
}

export async function sendInvoiceAction(formData: FormData) {
  const actor = await requirePagePermission("INVOICE_SEND");
  const id = formValue(formData, "id");
  const invoice = await sendInvoice(actor, id);
  revalidateInvoicePaths(invoice.projectId, invoice.id);
  redirect(`/invoices/${invoice.id}`);
}

export async function cancelInvoiceAction(formData: FormData) {
  const actor = await requirePagePermission("INVOICE_UPDATE");
  const id = formValue(formData, "id");
  const invoice = await cancelInvoice(actor, id);
  revalidateInvoicePaths(invoice.projectId, invoice.id);
  redirect(`/invoices/${invoice.id}`);
}

export async function markInvoiceOverdueAction(formData: FormData) {
  const actor = await requirePagePermission("INVOICE_UPDATE");
  const id = formValue(formData, "id");
  const invoice = await markInvoiceOverdue(actor, id);
  revalidateInvoicePaths(invoice.projectId, invoice.id);
  redirect(`/invoices/${invoice.id}`);
}

export async function deleteInvoiceAction(formData: FormData) {
  const actor = await requirePagePermission("INVOICE_CREATE");
  const id = formValue(formData, "id");
  const invoice = await deleteInvoice(actor, id);
  revalidateInvoicePaths(invoice.projectId);
  redirect("/invoices");
}
