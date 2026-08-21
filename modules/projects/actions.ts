"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/modules/projects/validation";
import {
  archiveProject,
  createProject,
  updateProject,
} from "@/modules/projects/service";
import { logger } from "@/lib/logging/logger";

export type ProjectFormState = {
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

function projectFields(formData: FormData) {
  return {
    clientId: formValue(formData, "clientId"),
    opportunityId: formValue(formData, "opportunityId"),
    proposalId: formValue(formData, "proposalId"),
    name: formValue(formData, "name"),
    description: formValue(formData, "description"),
    budget: formValue(formData, "budget"),
    estimatedCost: formValue(formData, "estimatedCost"),
    actualCost: formValue(formData, "actualCost"),
    startDate: formValue(formData, "startDate"),
    endDate: formValue(formData, "endDate"),
    status: formValue(formData, "status"),
    managerId: formValue(formData, "managerId"),
  };
}

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROJECT_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createProjectSchema.safeParse(projectFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const project = await createProject(actor, parsed.data);
    revalidatePath("/projects");
    revalidatePath(`/clients/${project.clientId}`);
    redirect(`/projects/${project.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create project failed", { operation: "project.create", error });
    return { message: "Unable to create this project. Try again." };
  }
}

export async function updateProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
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
    return { message: "Project id is required." };
  }

  const parsed = updateProjectSchema.safeParse(projectFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const project = await updateProject(actor, id, parsed.data);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath(`/clients/${project.clientId}`);
    redirect(`/projects/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update project failed", { operation: "project.update", error });
    return { message: "Unable to update this project. Try again." };
  }
}

export async function archiveProjectAction(formData: FormData) {
  const actor = await requirePagePermission("PROJECT_DELETE");
  const id = formValue(formData, "id");
  const project = await archiveProject(actor, id);
  revalidatePath("/projects");
  revalidatePath(`/clients/${project.clientId}`);
  redirect("/projects");
}
