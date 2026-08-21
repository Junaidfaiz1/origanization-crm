"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createOpportunitySchema,
  updateOpportunitySchema,
} from "@/modules/opportunities/validation";
import {
  archiveOpportunity,
  createOpportunity,
  updateOpportunity,
} from "@/modules/opportunities/service";
import { logger } from "@/lib/logging/logger";

export type OpportunityFormState = {
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

function opportunityFields(formData: FormData) {
  return {
    clientId: formValue(formData, "clientId"),
    name: formValue(formData, "name"),
    description: formValue(formData, "description"),
    estimatedValue: formValue(formData, "estimatedValue"),
    probability: formValue(formData, "probability"),
    expectedCloseDate: formValue(formData, "expectedCloseDate"),
    stage: formValue(formData, "stage"),
    assignedToId: formValue(formData, "assignedToId"),
  };
}

export async function createOpportunityAction(
  _prev: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  let actor;
  try {
    actor = await requirePagePermission("OPPORTUNITY_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createOpportunitySchema.safeParse(opportunityFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const opportunity = await createOpportunity(actor, parsed.data);
    revalidatePath("/opportunities");
    revalidatePath(`/clients/${opportunity.clientId}`);
    redirect(`/opportunities/${opportunity.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create opportunity failed", { operation: "opportunity.create", error });
    return { message: "Unable to create this opportunity. Try again." };
  }
}

export async function updateOpportunityAction(
  _prev: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  let actor;
  try {
    actor = await requirePagePermission("OPPORTUNITY_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) {
    return { message: "Opportunity id is required." };
  }

  const parsed = updateOpportunitySchema.safeParse(opportunityFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const opportunity = await updateOpportunity(actor, id, parsed.data);
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${id}`);
    revalidatePath(`/clients/${opportunity.clientId}`);
    redirect(`/opportunities/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update opportunity failed", { operation: "opportunity.update", error });
    return { message: "Unable to update this opportunity. Try again." };
  }
}

export async function archiveOpportunityAction(formData: FormData) {
  const actor = await requirePagePermission("OPPORTUNITY_UPDATE");
  const id = formValue(formData, "id");
  const opportunity = await archiveOpportunity(actor, id);
  revalidatePath("/opportunities");
  revalidatePath(`/clients/${opportunity.clientId}`);
  redirect("/opportunities");
}
