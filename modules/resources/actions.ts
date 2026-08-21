"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createResourceSchema,
  updateResourceSchema,
} from "@/modules/resources/validation";
import {
  createResource,
  deleteResource,
  updateResource,
} from "@/modules/resources/service";
import { logger } from "@/lib/logging/logger";

export type ResourceFormState = {
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

function resourceFields(formData: FormData) {
  const skillIds = formData.getAll("skillIds").filter((value): value is string => typeof value === "string");
  const experienceYears = formValue(formData, "experienceYears");

  return {
    userId: formValue(formData, "userId"),
    type: formValue(formData, "type"),
    hourlyRate: formValue(formData, "hourlyRate"),
    experienceYears: experienceYears ? experienceYears : undefined,
    bio: formValue(formData, "bio"),
    availabilityStatus: formValue(formData, "availabilityStatus"),
    rating: formValue(formData, "rating"),
    skillIds,
  };
}

function revalidateResourcePaths(resourceId?: string) {
  revalidatePath("/resources");
  if (resourceId) {
    revalidatePath(`/resources/${resourceId}`);
  }
}

export async function createResourceAction(
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  let actor;
  try {
    actor = await requirePagePermission("RESOURCE_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createResourceSchema.safeParse(resourceFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const resource = await createResource(actor, parsed.data);
    revalidateResourcePaths(resource.id);
    redirect(`/resources/${resource.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Create resource failed", { operation: "resource.create", error });
    return { message: "Unable to create this resource. Try again." };
  }
}

export async function updateResourceAction(
  _prev: ResourceFormState,
  formData: FormData,
): Promise<ResourceFormState> {
  let actor;
  try {
    actor = await requirePagePermission("RESOURCE_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Resource id is required." };

  const parsed = updateResourceSchema.safeParse(resourceFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const resource = await updateResource(actor, id, parsed.data);
    revalidateResourcePaths(resource.id);
    redirect(`/resources/${resource.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update resource failed", { operation: "resource.update", error });
    return { message: "Unable to update this resource. Try again." };
  }
}

export async function deleteResourceAction(formData: FormData) {
  const actor = await requirePagePermission("RESOURCE_DELETE");
  const id = formValue(formData, "id");
  await deleteResource(actor, id);
  revalidateResourcePaths();
  redirect("/resources");
}
