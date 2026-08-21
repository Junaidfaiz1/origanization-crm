import { BusinessRuleError, ValidationError } from "@/lib/errors/app-error";
import { isProjectClosed } from "@/modules/projects/rules";

export const FILE_ENTITY_TYPES = ["Project", "ProjectRequirement", "Expense"] as const;
export type FileEntityType = (typeof FILE_ENTITY_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
] as const;

export type ProjectForFiles = {
  archivedAt: Date | null;
  status: string;
};

export function assertCanManageProjectFiles(project: ProjectForFiles): void {
  if (project.archivedAt) {
    throw new BusinessRuleError("Archived projects cannot manage files");
  }
  if (isProjectClosed(project.status)) {
    throw new BusinessRuleError(
      "Completed, closed, or cancelled projects cannot manage files without reopening",
    );
  }
}

export function assertValidUpload(input: {
  fileName: string;
  mimeType: string;
  size: number;
}): void {
  if (!input.fileName.trim()) {
    throw new ValidationError("File name is required");
  }
  if (input.size <= 0) {
    throw new ValidationError("File is empty");
  }
  if (input.size > MAX_FILE_SIZE_BYTES) {
    throw new ValidationError("File exceeds the 10 MB limit");
  }
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new ValidationError("This file type is not allowed");
  }
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.trim().replaceAll(/[\\/]+/g, "_");
  return base.slice(0, 180) || "upload.bin";
}
