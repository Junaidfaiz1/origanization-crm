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
  assertCanManageRequirements,
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
} from "@/modules/requirements/rules";
import type {
  CreateRequirementInput,
  RequirementListFilter,
  UpdateRequirementInput,
} from "@/modules/requirements/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const requirementInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      archivedAt: true,
      organizationId: true,
      client: {
        select: {
          id: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.ProjectRequirementInclude;

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

export function serializeRequirement(
  requirement: Prisma.ProjectRequirementGetPayload<{
    include: typeof requirementInclude;
  }>,
) {
  return {
    id: requirement.id,
    projectId: requirement.projectId,
    project: {
      id: requirement.project.id,
      name: requirement.project.name,
      status: requirement.project.status,
      clientId: requirement.project.client.id,
      clientName: requirement.project.client.company.name,
    },
    title: requirement.title,
    description: requirement.description,
    priority: requirement.priority,
    status: requirement.status,
    createdAt: requirement.createdAt,
    updatedAt: requirement.updatedAt,
  };
}

export type SerializedRequirement = ReturnType<typeof serializeRequirement>;

async function getTenantProject(actor: TenantActor, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: actor.organizationId,
    },
    select: {
      id: true,
      name: true,
      status: true,
      archivedAt: true,
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
}

async function getTenantRequirement(actor: TenantActor, id: string) {
  const requirement = await prisma.projectRequirement.findFirst({
    where: {
      id,
      project: { organizationId: actor.organizationId },
    },
    include: requirementInclude,
  });

  if (!requirement) {
    throw new NotFoundError("Requirement not found");
  }

  return requirement;
}

function listWhere(
  organizationId: string,
  filter: RequirementListFilter,
): Prisma.ProjectRequirementWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ProjectRequirementWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return {
    project: {
      organizationId,
      archivedAt: null,
      ...(filter.projectId ? { id: filter.projectId } : {}),
    },
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.priority ? { priority: filter.priority } : {}),
    ...(and.length ? { AND: and } : {}),
  };
}

export async function listRequirements(actor: TenantActor, filter: RequirementListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.projectRequirement.findMany({
    where,
    include: requirementInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeRequirement),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.projectRequirement.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getRequirement(actor: TenantActor, id: string) {
  const requirement = await getTenantRequirement(actor, id);
  return serializeRequirement(requirement);
}

export async function listRequirementProjectOptions(actor: TenantActor) {
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

export async function createRequirement(actor: TenantActor, input: CreateRequirementInput) {
  const project = await getTenantProject(actor, input.projectId);
  assertCanManageRequirements(project);

  const requirement = await prisma.$transaction(async (tx) => {
    const created = await tx.projectRequirement.create({
      data: {
        projectId: project.id,
        title: input.title,
        description: emptyToNull(input.description),
        priority: input.priority ?? "MEDIUM",
        status: input.status ?? "OPEN",
      },
      include: requirementInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created requirement",
        entityType: "ProjectRequirement",
        entityId: created.id,
        newValue: {
          projectId: created.projectId,
          title: created.title,
          priority: created.priority,
          status: created.status,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Requirement created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: requirement.id,
    operation: "requirement.create",
  });

  return serializeRequirement(requirement);
}

export async function updateRequirement(
  actor: TenantActor,
  id: string,
  input: UpdateRequirementInput,
) {
  const existing = await getTenantRequirement(actor, id);
  assertCanManageRequirements(existing.project);

  if (input.projectId && input.projectId !== existing.projectId) {
    throw new ValidationError("Requirements cannot be moved to another project");
  }

  const requirement = await prisma.$transaction(async (tx) => {
    const updated = await tx.projectRequirement.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: requirementInclude,
    });

    const statusChanged = input.status !== undefined && input.status !== existing.status;

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: statusChanged ? "Updated requirement status" : "Updated requirement",
        entityType: "ProjectRequirement",
        entityId: updated.id,
        oldValue: {
          status: existing.status,
          priority: existing.priority,
          title: existing.title,
        },
        newValue: {
          status: updated.status,
          priority: updated.priority,
          title: updated.title,
        },
      },
      tx,
    );

    return updated;
  });

  return serializeRequirement(requirement);
}

export async function deleteRequirement(actor: TenantActor, id: string) {
  const existing = await getTenantRequirement(actor, id);
  assertCanManageRequirements(existing.project);

  await prisma.$transaction(async (tx) => {
    await tx.projectRequirement.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted requirement",
        entityType: "ProjectRequirement",
        entityId: existing.id,
        oldValue: {
          projectId: existing.projectId,
          title: existing.title,
          status: existing.status,
          priority: existing.priority,
        },
      },
      tx,
    );
  });

  return serializeRequirement(existing);
}

export async function getRequirementStatusSummary(
  actor: TenantActor,
  projectId?: string,
) {
  const where: Prisma.ProjectRequirementWhereInput = {
    project: {
      organizationId: actor.organizationId,
      archivedAt: null,
      ...(projectId ? { id: projectId } : {}),
    },
  };

  const requirements = await prisma.projectRequirement.findMany({
    where,
    select: { status: true, priority: true },
  });

  return {
    total: requirements.length,
    openCount: requirements.filter((row) => row.status === "OPEN").length,
    doneCount: requirements.filter((row) => row.status === "DONE").length,
    stages: REQUIREMENT_STATUSES.map((status) => ({
      status,
      count: requirements.filter((row) => row.status === status).length,
    })),
    priorities: REQUIREMENT_PRIORITIES.map((priority) => ({
      priority,
      count: requirements.filter((row) => row.priority === priority).length,
    })),
  };
}
