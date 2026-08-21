"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createMilestoneSchema,
  updateMilestoneSchema,
} from "@/modules/milestones/validation";
import {
  createMilestone,
  deleteMilestone,
  updateMilestone,
} from "@/modules/milestones/service";
import { logger } from "@/lib/logging/logger";

export type MilestoneFormState = {
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

function milestoneFields(formData: FormData) {
  return {
    projectId: formValue(formData, "projectId"),
    name: formValue(formData, "name"),
    description: formValue(formData, "description"),
    amount: formValue(formData, "amount"),
    dueDate: formValue(formData, "dueDate"),
    status: formValue(formData, "status"),
    order: formValue(formData, "order"),
  };
}

function revalidateMilestonePaths(projectId: string, milestoneId?: string) {
  revalidatePath("/milestones");
  revalidatePath(`/projects/${projectId}`);
  if (milestoneId) {
    revalidatePath(`/milestones/${milestoneId}`);
  }
}

export async function createMilestoneAction(
  _prev: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROJECT_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createMilestoneSchema.safeParse(milestoneFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const milestone = await createMilestone(actor, parsed.data);
    revalidateMilestonePaths(milestone.projectId, milestone.id);
    redirect(`/milestones/${milestone.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create milestone failed", { operation: "milestone.create", error });
    return { message: "Unable to create this milestone. Try again." };
  }
}

export async function updateMilestoneAction(
  _prev: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROJECT_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) {
    return { message: "Milestone id is required." };
  }

  const parsed = updateMilestoneSchema.safeParse(milestoneFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const milestone = await updateMilestone(actor, id, parsed.data);
    revalidateMilestonePaths(milestone.projectId, milestone.id);
    redirect(`/milestones/${milestone.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update milestone failed", { operation: "milestone.update", error });
    return { message: "Unable to update this milestone. Try again." };
  }
}

export async function deleteMilestoneAction(formData: FormData) {
  const actor = await requirePagePermission("PROJECT_UPDATE");
  const id = formValue(formData, "id");
  const milestone = await deleteMilestone(actor, id);
  revalidateMilestonePaths(milestone.projectId);
  redirect("/milestones");
}
