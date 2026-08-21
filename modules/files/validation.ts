import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";
import { FILE_ENTITY_TYPES } from "@/modules/files/rules";

export const fileEntityTypeSchema = z.enum(FILE_ENTITY_TYPES);

export const fileListFilterSchema = z.object({
  search: z.string().trim().optional(),
  entityType: fileEntityTypeSchema.optional(),
  entityId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const uploadFileMetaSchema = z.object({
  entityType: fileEntityTypeSchema.default("Project"),
  entityId: z.string().trim().min(1, "Related record is required"),
});

export type FileListFilter = z.infer<typeof fileListFilterSchema>;
export type UploadFileMeta = z.infer<typeof uploadFileMetaSchema>;
