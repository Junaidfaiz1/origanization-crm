"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createRequirementSchema,
  updateRequirementSchema,
} from "@/modules/requirements/validation";
import {
  createRequirement,
  deleteRequirement,
  updateRequirement,
} from "@/modules/requirements/service";
import { logger } from "@/lib/logging/logger";

export type RequirementFormState = {
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

function requirementFields(formData: FormData) {
  return {
    projectId: formValue(formData, "projectId"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status"),
  };
}

function revalidateRequirementPaths(projectId: string, requirementId?: string) {
  revalidatePath("/requirements");
  revalidatePath(`/projects/${projectId}`);
  if (requirementId) {
    revalidatePath(`/requirements/${requirementId}`);
  }
}

export async function createRequirementAction(
  _prev: RequirementFormState,
  formData: FormData,
): Promise<RequirementFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROJECT_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createRequirementSchema.safeParse(requirementFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const requirement = await createRequirement(actor, parsed.data);
    revalidateRequirementPaths(requirement.projectId, requirement.id);
    redirect(`/requirements/${requirement.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create requirement failed", {
      operation: "requirement.create",
      error,
    });
    return { message: "Unable to create this requirement. Try again." };
  }
}

export async function updateRequirementAction(
  _prev: RequirementFormState,
  formData: FormData,
): Promise<RequirementFormState> {
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
    return { message: "Requirement id is required." };
  }

  const parsed = updateRequirementSchema.safeParse(requirementFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const requirement = await updateRequirement(actor, id, parsed.data);
    revalidateRequirementPaths(requirement.projectId, requirement.id);
    redirect(`/requirements/${requirement.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update requirement failed", {
      operation: "requirement.update",
      error,
    });
    return { message: "Unable to update this requirement. Try again." };
  }
}

export async function deleteRequirementAction(formData: FormData) {
  const actor = await requirePagePermission("PROJECT_UPDATE");
  const id = formValue(formData, "id");
  const requirement = await deleteRequirement(actor, id);
  revalidateRequirementPaths(requirement.projectId);
  redirect("/requirements");
}
