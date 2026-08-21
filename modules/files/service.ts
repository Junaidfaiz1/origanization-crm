import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import {
  getStorageService,
  isR2StorageConfigured,
} from "@/lib/storage/storage-service";
import {
  assertCanManageProjectFiles,
  assertValidUpload,
  sanitizeFileName,
  type FileEntityType,
} from "@/modules/files/rules";
import type { FileListFilter, UploadFileMeta } from "@/modules/files/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const fileInclude = {
  uploadedBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.FileInclude;

export function serializeFile(file: Prisma.FileGetPayload<{ include: typeof fileInclude }>) {
  return {
    id: file.id,
    organizationId: file.organizationId,
    uploadedById: file.uploadedById,
    uploadedBy: file.uploadedBy,
    entityType: file.entityType,
    entityId: file.entityId,
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.size,
    createdAt: file.createdAt,
  };
}

export type SerializedFile = ReturnType<typeof serializeFile>;

type ResolvedEntity = {
  entityType: FileEntityType;
  entityId: string;
  projectId: string | null;
  project: { id: string; name: string; status: string; archivedAt: Date | null } | null;
};

async function resolveEntity(
  actor: TenantActor,
  entityType: FileEntityType,
  entityId: string,
): Promise<ResolvedEntity> {
  if (entityType === "Project") {
    const project = await prisma.project.findFirst({
      where: { id: entityId, organizationId: actor.organizationId },
      select: { id: true, name: true, status: true, archivedAt: true },
    });
    if (!project) {
      throw new NotFoundError("Project not found");
    }
    return {
      entityType,
      entityId: project.id,
      projectId: project.id,
      project,
    };
  }

  if (entityType === "ProjectRequirement") {
    const requirement = await prisma.projectRequirement.findFirst({
      where: {
        id: entityId,
        project: { organizationId: actor.organizationId },
      },
      select: {
        id: true,
        project: {
          select: { id: true, name: true, status: true, archivedAt: true },
        },
      },
    });
    if (!requirement) {
      throw new NotFoundError("Requirement not found");
    }
    return {
      entityType,
      entityId: requirement.id,
      projectId: requirement.project.id,
      project: requirement.project,
    };
  }

  const expense = await prisma.expense.findFirst({
    where: { id: entityId, organizationId: actor.organizationId },
    select: {
      id: true,
      project: {
        select: { id: true, name: true, status: true, archivedAt: true },
      },
    },
  });
  if (!expense) {
    throw new NotFoundError("Expense not found");
  }
  return {
    entityType,
    entityId: expense.id,
    projectId: expense.project.id,
    project: expense.project,
  };
}

async function getTenantFile(actor: TenantActor, id: string) {
  const file = await prisma.file.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: fileInclude,
  });
  if (!file) {
    throw new NotFoundError("File not found");
  }
  return file;
}

async function listWhere(
  organizationId: string,
  filter: FileListFilter,
): Promise<Prisma.FileWhereInput> {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.FileWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { fileName: { contains: search, mode: "insensitive" } },
        { mimeType: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  let entityType = filter.entityType;
  let entityId = filter.entityId;

  if (filter.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: filter.projectId, organizationId, archivedAt: null },
      select: { id: true },
    });
    if (!project) {
      return { id: "__none__" };
    }

    const requirementIds = await prisma.projectRequirement.findMany({
      where: { projectId: project.id },
      select: { id: true },
    });
    const expenseIds = await prisma.expense.findMany({
      where: { projectId: project.id, organizationId },
      select: { id: true },
    });

    and.push({
      OR: [
        { entityType: "Project", entityId: project.id },
        ...(requirementIds.length
          ? [
              {
                entityType: "ProjectRequirement",
                entityId: { in: requirementIds.map((row) => row.id) },
              },
            ]
          : []),
        ...(expenseIds.length
          ? [{ entityType: "Expense", entityId: { in: expenseIds.map((row) => row.id) } }]
          : []),
      ],
    });
    entityType = undefined;
    entityId = undefined;
  }

  return {
    organizationId,
    ...(entityType ? { entityType } : {}),
    ...(entityId ? { entityId } : {}),
    ...(and.length ? { AND: and } : {}),
  };
}

export async function listFiles(actor: TenantActor, filter: FileListFilter) {
  const first = filter.first ?? 20;
  const where = await listWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.file.findMany({
    where,
    include: fileInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeFile),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.file.count({
      where: await listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getFile(actor: TenantActor, id: string) {
  return serializeFile(await getTenantFile(actor, id));
}

export async function listFileProjectOptions(actor: TenantActor) {
  return prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      status: true,
      client: { select: { company: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function uploadFile(
  actor: TenantActor,
  meta: UploadFileMeta,
  upload: {
    fileName: string;
    mimeType: string;
    size: number;
    body: Buffer;
  },
) {
  assertValidUpload(upload);
  if (!isR2StorageConfigured()) {
    throw new ValidationError(
      "File storage is not configured. Set Cloudflare R2 credentials.",
    );
  }
  const entity = await resolveEntity(actor, meta.entityType, meta.entityId);
  if (entity.project) {
    assertCanManageProjectFiles(entity.project);
  }

  const safeName = sanitizeFileName(upload.fileName);
  const storageKey = `${actor.organizationId}/${entity.entityType}/${entity.entityId}/${randomUUID()}-${safeName}`;
  const storage = getStorageService();

  await storage.upload({
    key: storageKey,
    body: upload.body,
    mimeType: upload.mimeType,
  });

  try {
    const file = await prisma.$transaction(async (tx) => {
      const created = await tx.file.create({
        data: {
          organizationId: actor.organizationId,
          uploadedById: actor.userId,
          entityType: entity.entityType,
          entityId: entity.entityId,
          fileName: safeName,
          storageKey,
          mimeType: upload.mimeType,
          size: upload.size,
        },
        include: fileInclude,
      });

      if (entity.entityType === "Expense") {
        await tx.expense.updateMany({
          where: {
            id: entity.entityId,
            organizationId: actor.organizationId,
          },
          data: { receiptFileId: created.id },
        });
      }

      await writeAuditLog(
        {
          organizationId: actor.organizationId,
          userId: actor.userId,
          action: "Uploaded file",
          entityType: "File",
          entityId: created.id,
          newValue: {
            fileName: created.fileName,
            entityType: created.entityType,
            entityId: created.entityId,
            size: created.size,
            mimeType: created.mimeType,
          },
        },
        tx,
      );

      return created;
    });

    logger.info("File uploaded", {
      userId: actor.userId,
      organizationId: actor.organizationId,
      entityId: file.id,
      operation: "file.upload",
      backend: "r2",
    });

    return serializeFile(file);
  } catch (error) {
    await storage.delete(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function deleteFile(actor: TenantActor, id: string) {
  const existing = await getTenantFile(actor, id);
  const entity = await resolveEntity(
    actor,
    existing.entityType as FileEntityType,
    existing.entityId,
  );
  if (entity.project) {
    assertCanManageProjectFiles(entity.project);
  }

  await prisma.$transaction(async (tx) => {
    if (existing.entityType === "Expense") {
      await tx.expense.updateMany({
        where: {
          organizationId: actor.organizationId,
          receiptFileId: existing.id,
        },
        data: { receiptFileId: null },
      });
    }

    await tx.file.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted file",
        entityType: "File",
        entityId: existing.id,
        oldValue: {
          fileName: existing.fileName,
          entityType: existing.entityType,
          entityId: existing.entityId,
        },
      },
      tx,
    );
  });

  await getStorageService().delete(existing.storageKey).catch(() => undefined);

  return serializeFile(existing);
}

export async function getFileDownloadUrl(actor: TenantActor, id: string) {
  const file = await getTenantFile(actor, id);

  if (!isR2StorageConfigured()) {
    throw new ValidationError(
      "File storage is not configured. Set Cloudflare R2 credentials.",
    );
  }

  return {
    url: await getStorageService().getSignedUrl(file.storageKey, 900),
    fileName: file.fileName,
    mimeType: file.mimeType,
    mode: "signed" as const,
  };
}

export async function readFileBytes(actor: TenantActor, id: string) {
  const file = await getTenantFile(actor, id);
  const body = await getStorageService().getObject(file.storageKey);
  return {
    body,
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.size,
  };
}

export async function getFileSummary(actor: TenantActor, projectId?: string) {
  const where = await listWhere(actor.organizationId, {
    projectId,
    first: 20,
    sort: "newest",
  });
  const files = await prisma.file.findMany({
    where,
    select: { size: true, entityType: true },
  });

  return {
    total: files.length,
    totalBytes: files.reduce((sum, row) => sum + row.size, 0),
    projectCount: files.filter((row) => row.entityType === "Project").length,
  };
}
