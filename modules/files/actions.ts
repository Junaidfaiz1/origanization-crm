"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import { uploadFileMetaSchema } from "@/modules/files/validation";
import { deleteFile, uploadFile } from "@/modules/files/service";
import { logger } from "@/lib/logging/logger";

export type FileFormState = {
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

function revalidateFilePaths(entityType: string, entityId: string, fileId?: string) {
  revalidatePath("/files");
  if (entityType === "Project") {
    revalidatePath(`/projects/${entityId}`);
  }
  if (fileId) {
    revalidatePath(`/files/${fileId}`);
  }
}

export async function uploadFileAction(
  _prev: FileFormState,
  formData: FormData,
): Promise<FileFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROJECT_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = uploadFileMetaSchema.safeParse({
    entityType: formValue(formData, "entityType") || "Project",
    entityId: formValue(formData, "entityId"),
  });
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const raw = formData.get("file");
  if (!(raw instanceof File) || raw.size === 0) {
    return {
      message: "Choose a file to upload.",
      errors: { file: ["File is required"] },
    };
  }

  try {
    const buffer = Buffer.from(await raw.arrayBuffer());
    const file = await uploadFile(actor, parsed.data, {
      fileName: raw.name,
      mimeType: raw.type || "application/octet-stream",
      size: raw.size,
      body: buffer,
    });
    revalidateFilePaths(file.entityType, file.entityId, file.id);
    redirect(`/files/${file.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Upload file failed", { operation: "file.upload", error });
    return { message: "Unable to upload this file. Try again." };
  }
}

export async function deleteFileAction(formData: FormData) {
  const actor = await requirePagePermission("PROJECT_UPDATE");
  const id = formValue(formData, "id");
  const file = await deleteFile(actor, id);
  revalidateFilePaths(file.entityType, file.entityId);
  redirect("/files");
}
