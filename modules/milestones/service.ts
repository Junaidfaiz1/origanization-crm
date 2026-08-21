import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  assertCanDeleteMilestone,
  assertCanManageMilestones,
  MILESTONE_STATUSES,
} from "@/modules/milestones/rules";
import type {
  CreateMilestoneInput,
  MilestoneListFilter,
  UpdateMilestoneInput,
} from "@/modules/milestones/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const milestoneInclude = {
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
  _count: {
    select: { tasks: true },
  },
} satisfies Prisma.MilestoneInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function parseOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("Invalid date");
  }
  return date;
}

function parseOptionalDecimal(value: string | undefined) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ValidationError("Amount must be a non-negative number");
  }
  return parsed;
}

export function serializeMilestone(
  milestone: Prisma.MilestoneGetPayload<{ include: typeof milestoneInclude }>,
) {
  return {
    id: milestone.id,
    projectId: milestone.projectId,
    project: {
      id: milestone.project.id,
      name: milestone.project.name,
      status: milestone.project.status,
      clientId: milestone.project.client.id,
      clientName: milestone.project.client.company.name,
    },
    name: milestone.name,
    description: milestone.description,
    amount: moneyString(milestone.amount),
    dueDate: milestone.dueDate,
    status: milestone.status,
    order: milestone.order,
    taskCount: milestone._count.tasks,
    createdAt: milestone.createdAt,
    updatedAt: milestone.updatedAt,
  };
}

export type SerializedMilestone = ReturnType<typeof serializeMilestone>;

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

async function getTenantMilestone(actor: TenantActor, id: string) {
  const milestone = await prisma.milestone.findFirst({
    where: {
      id,
      project: { organizationId: actor.organizationId },
    },
    include: milestoneInclude,
  });

  if (!milestone) {
    throw new NotFoundError("Milestone not found");
  }

  return milestone;
}

function listWhere(
  organizationId: string,
  filter: MilestoneListFilter,
): Prisma.MilestoneWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.MilestoneWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (decoded) {
    and.push({
      OR: [
        { createdAt: { lt: decoded.createdAt } },
        {
          AND: [{ createdAt: decoded.createdAt }, { id: { lt: decoded.id } }],
        },
      ],
    });
  }

  return {
    project: {
      organizationId,
      archivedAt: null,
      ...(filter.projectId ? { id: filter.projectId } : {}),
    },
    ...(filter.status ? { status: filter.status } : {}),
    ...(and.length ? { AND: and } : {}),
  };
}

export async function listMilestones(actor: TenantActor, filter: MilestoneListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);

  const rows = await prisma.milestone.findMany({
    where,
    include: milestoneInclude,
    orderBy: filter.projectId
      ? [{ order: "asc" }, { createdAt: "asc" }, { id: "asc" }]
      : [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeMilestone),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.milestone.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getMilestone(actor: TenantActor, id: string) {
  const milestone = await getTenantMilestone(actor, id);
  return serializeMilestone(milestone);
}

export async function listMilestoneProjectOptions(actor: TenantActor) {
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

export async function createMilestone(actor: TenantActor, input: CreateMilestoneInput) {
  const project = await getTenantProject(actor, input.projectId);
  assertCanManageMilestones(project);

  let order = input.order ?? 0;
  if (order === 0) {
    const max = await prisma.milestone.aggregate({
      where: { projectId: project.id },
      _max: { order: true },
    });
    order = (max._max.order ?? 0) + 1;
  }

  const milestone = await prisma.$transaction(async (tx) => {
    const created = await tx.milestone.create({
      data: {
        projectId: project.id,
        name: input.name,
        description: emptyToNull(input.description),
        amount: parseOptionalDecimal(input.amount),
        dueDate: parseOptionalDate(input.dueDate),
        status: input.status ?? "PENDING",
        order,
      },
      include: milestoneInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created milestone",
        entityType: "Milestone",
        entityId: created.id,
        newValue: {
          projectId: created.projectId,
          name: created.name,
          status: created.status,
          order: created.order,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Milestone created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: milestone.id,
    operation: "milestone.create",
  });

  return serializeMilestone(milestone);
}

export async function updateMilestone(
  actor: TenantActor,
  id: string,
  input: UpdateMilestoneInput,
) {
  const existing = await getTenantMilestone(actor, id);
  assertCanManageMilestones(existing.project);

  if (input.projectId && input.projectId !== existing.projectId) {
    throw new ValidationError("Milestones cannot be moved to another project");
  }

  const milestone = await prisma.$transaction(async (tx) => {
    const updated = await tx.milestone.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.amount !== undefined ? { amount: parseOptionalDecimal(input.amount) } : {}),
        ...(input.dueDate !== undefined ? { dueDate: parseOptionalDate(input.dueDate) } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.order !== undefined ? { order: input.order } : {}),
      },
      include: milestoneInclude,
    });

    const statusChanged = input.status !== undefined && input.status !== existing.status;

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: statusChanged ? "Updated milestone status" : "Updated milestone",
        entityType: "Milestone",
        entityId: updated.id,
        oldValue: {
          status: existing.status,
          name: existing.name,
          order: existing.order,
        },
        newValue: {
          status: updated.status,
          name: updated.name,
          order: updated.order,
        },
      },
      tx,
    );

    return updated;
  });

  return serializeMilestone(milestone);
}

export async function deleteMilestone(actor: TenantActor, id: string) {
  const existing = await getTenantMilestone(actor, id);
  assertCanManageMilestones(existing.project);
  assertCanDeleteMilestone(existing._count.tasks);

  await prisma.$transaction(async (tx) => {
    await tx.milestone.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted milestone",
        entityType: "Milestone",
        entityId: existing.id,
        oldValue: {
          projectId: existing.projectId,
          name: existing.name,
          status: existing.status,
        },
      },
      tx,
    );
  });

  return serializeMilestone(existing);
}

export async function getMilestoneStatusSummary(
  actor: TenantActor,
  projectId?: string,
) {
  const where: Prisma.MilestoneWhereInput = {
    project: {
      organizationId: actor.organizationId,
      archivedAt: null,
      ...(projectId ? { id: projectId } : {}),
    },
  };

  const milestones = await prisma.milestone.findMany({
    where,
    select: { status: true, amount: true },
  });

  const toNumber = (value: { toString(): string } | null) =>
    value ? Number(value.toString()) : 0;

  const totalAmount = milestones.reduce((sum, row) => sum + toNumber(row.amount), 0);
  const completedAmount = milestones
    .filter((row) => row.status === "COMPLETED")
    .reduce((sum, row) => sum + toNumber(row.amount), 0);

  return {
    total: milestones.length,
    totalAmount: totalAmount.toFixed(2),
    completedAmount: completedAmount.toFixed(2),
    stages: MILESTONE_STATUSES.map((status) => ({
      status,
      count: milestones.filter((row) => row.status === status).length,
    })),
  };
}
