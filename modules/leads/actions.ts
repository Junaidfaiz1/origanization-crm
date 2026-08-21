"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError, ValidationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { createLeadSchema, updateLeadSchema, leadStatusSchema } from "@/modules/leads/validation";
import { archiveLead, convertLead, createLead, updateLead } from "@/modules/leads/service";
import { logger } from "@/lib/logging/logger";
import { withFlashToast } from "@/lib/ui/flash-toast";

export type LeadFormState = {
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

function leadFields(formData: FormData) {
  const estimatedRaw = formValue(formData, "estimatedValue");
  const assignedToId = formValue(formData, "assignedToId");
  return {
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    companyName: formValue(formData, "companyName"),
    source: formValue(formData, "source"),
    estimatedValue: estimatedRaw ? Number(estimatedRaw) : undefined,
    status: formValue(formData, "status") || undefined,
    assignedToId: assignedToId || undefined,
    notes: formValue(formData, "notes"),
  };
}

export async function createLeadAction(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  let actor;
  try {
    actor = await requirePagePermission("LEAD_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createLeadSchema.safeParse(leadFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const lead = await createLead(actor, parsed.data);
    revalidatePath("/leads");
    redirect(withFlashToast(`/leads/${lead.id}`, "created"));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create lead failed", { operation: "lead.create", error });
    return { message: "Unable to create this lead. Try again." };
  }
}

export async function updateLeadAction(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  let actor;
  try {
    actor = await requirePagePermission("LEAD_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) {
    return { message: "Lead id is required." };
  }

  const parsed = updateLeadSchema.safeParse(leadFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateLead(actor, id, parsed.data);
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    redirect(withFlashToast(`/leads/${id}`, "updated"));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update lead failed", { operation: "lead.update", error });
    return { message: "Unable to update this lead. Try again." };
  }
}

export async function updateLeadStatusAction(formData: FormData) {
  const actor = await requirePagePermission("LEAD_UPDATE");
  const id = formValue(formData, "id");
  const status = leadStatusSchema.parse(formValue(formData, "status"));
  if (!id) {
    throw new ValidationError("Lead id is required");
  }
  await updateLead(actor, id, { status });
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
}

export async function archiveLeadAction(formData: FormData) {
  const actor = await requirePagePermission("LEAD_DELETE");
  if (!hasPermission(actor.permissions, "LEAD_DELETE")) {
    throw new AuthorizationError();
  }
  const id = formValue(formData, "id");
  await archiveLead(actor, id);
  revalidatePath("/leads");
  redirect(withFlashToast("/leads", "archived"));
}

export async function convertLeadAction(formData: FormData) {
  const actor = await requirePagePermission("LEAD_UPDATE");
  const id = formValue(formData, "id");
  try {
    const result = await convertLead(actor, id);
    revalidatePath("/leads");
    revalidatePath(`/leads/${id}`);
    redirect(withFlashToast(`/leads/${result.lead.id}`, "converted"));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    logger.error("Convert lead failed", { operation: "lead.convert", error, entityId: id });
    redirect(`/leads/${id}?error=convert`);
  }
}
