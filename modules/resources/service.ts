import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import { assertCanDeleteResource } from "@/modules/resources/rules";
import type {
  CreateResourceInput,
  ResourceListFilter,
  UpdateResourceInput,
} from "@/modules/resources/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const resourceInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  skills: {
    include: {
      skill: {
        select: { id: true, name: true },
      },
    },
  },
  _count: {
    select: {
      projectMembers: true,
      contracts: true,
      bids: true,
    },
  },
} satisfies Prisma.ResourceInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function parseOptionalRate(value: string | undefined) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ValidationError("Hourly rate must be a non-negative number");
  }
  return parsed;
}

function parseOptionalRating(value: string | undefined) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 5) {
    throw new ValidationError("Rating must be between 0 and 5");
  }
  return parsed;
}

async function assertActiveMember(organizationId: string, userId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new ValidationError("Team member must belong to this organization");
  }
}

async function assertUniqueResourceUser(
  organizationId: string,
  userId: string,
  excludeId?: string,
) {
  const existing = await prisma.resource.findFirst({
    where: {
      organizationId,
      userId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("This user already has a resource profile");
  }
}

async function resolveSkillIds(organizationId: string, skillIds: string[]) {
  if (skillIds.length === 0) {
    return [];
  }

  const skills = await prisma.skill.findMany({
    where: {
      id: { in: skillIds },
      OR: [{ organizationId }, { organizationId: null }],
    },
    select: { id: true },
  });

  if (skills.length !== skillIds.length) {
    throw new ValidationError("One or more skills are invalid");
  }

  return skills.map((skill) => skill.id);
}

async function syncResourceSkills(resourceId: string, skillIds: string[], tx: Prisma.TransactionClient) {
  await tx.resourceSkill.deleteMany({ where: { resourceId } });
  if (skillIds.length > 0) {
    await tx.resourceSkill.createMany({
      data: skillIds.map((skillId) => ({ resourceId, skillId })),
    });
  }
}

export function serializeResource(
  resource: Prisma.ResourceGetPayload<{ include: typeof resourceInclude }>,
) {
  return {
    id: resource.id,
    userId: resource.userId,
    user: resource.user,
    type: resource.type,
    hourlyRate: moneyString(resource.hourlyRate),
    experienceYears: resource.experienceYears,
    bio: resource.bio,
    availabilityStatus: resource.availabilityStatus,
    rating: moneyString(resource.rating),
    skills: resource.skills.map((row) => row.skill),
    projectCount: resource._count.projectMembers,
    contractCount: resource._count.contracts,
    bidCount: resource._count.bids,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
}

export type SerializedResource = ReturnType<typeof serializeResource>;

function listWhere(organizationId: string, filter: ResourceListFilter): Prisma.ResourceWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ResourceWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { bio: { contains: search, mode: "insensitive" } },
        { skills: { some: { skill: { name: { contains: search, mode: "insensitive" } } } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return tenantWhere(organizationId, {
    ...(filter.type ? { type: filter.type } : {}),
    ...(filter.availabilityStatus ? { availabilityStatus: filter.availabilityStatus } : {}),
    ...(filter.skillId ? { skills: { some: { skillId: filter.skillId } } } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listResources(actor: TenantActor, filter: ResourceListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.resource.findMany({
    where,
    include: resourceInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeResource),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.resource.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getResource(actor: TenantActor, id: string) {
  const resource = await prisma.resource.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: resourceInclude,
  });

  if (!resource) {
    throw new NotFoundError("Resource not found");
  }

  return serializeResource(resource);
}

export async function listResourceMemberOptions(actor: TenantActor) {
  const existingUserIds = await prisma.resource.findMany({
    where: { organizationId: actor.organizationId },
    select: { userId: true },
  });
  const taken = new Set(existingUserIds.map((row) => row.userId));

  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: actor.organizationId,
      status: "ACTIVE",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, status: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members
    .filter((member) => member.user.status === "ACTIVE" && !taken.has(member.user.id))
    .map((member) => member.user);
}

export async function listSkillOptions(actor: TenantActor) {
  return prisma.skill.findMany({
    where: {
      OR: [{ organizationId: actor.organizationId }, { organizationId: null }],
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function createResource(actor: TenantActor, input: CreateResourceInput) {
  await assertActiveMember(actor.organizationId, input.userId);
  await assertUniqueResourceUser(actor.organizationId, input.userId);
  const skillIds = await resolveSkillIds(actor.organizationId, input.skillIds ?? []);

  const resource = await prisma.$transaction(async (tx) => {
    const created = await tx.resource.create({
      data: {
        organizationId: actor.organizationId,
        userId: input.userId,
        type: input.type,
        hourlyRate: parseOptionalRate(input.hourlyRate),
        experienceYears: input.experienceYears ?? null,
        bio: emptyToNull(input.bio),
        availabilityStatus: input.availabilityStatus ?? "AVAILABLE",
        rating: parseOptionalRating(input.rating),
      },
      include: resourceInclude,
    });

    await syncResourceSkills(created.id, skillIds, tx);

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created resource profile",
        entityType: "Resource",
        entityId: created.id,
        newValue: {
          userId: created.userId,
          type: created.type,
          availabilityStatus: created.availabilityStatus,
        },
      },
      tx,
    );

    const withSkills = await tx.resource.findFirstOrThrow({
      where: { id: created.id },
      include: resourceInclude,
    });

    return withSkills;
  });

  logger.info("Resource created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: resource.id,
    operation: "resource.create",
  });

  return serializeResource(resource);
}

export async function updateResource(actor: TenantActor, id: string, input: UpdateResourceInput) {
  const existing = await prisma.resource.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: resourceInclude,
  });
  if (!existing) {
    throw new NotFoundError("Resource not found");
  }

  const skillIds =
    input.skillIds !== undefined
      ? await resolveSkillIds(actor.organizationId, input.skillIds)
      : undefined;

  const resource = await prisma.$transaction(async (tx) => {
    const updated = await tx.resource.update({
      where: { id: existing.id },
      data: {
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.hourlyRate !== undefined
          ? { hourlyRate: parseOptionalRate(input.hourlyRate) }
          : {}),
        ...(input.experienceYears !== undefined
          ? { experienceYears: input.experienceYears }
          : {}),
        ...(input.bio !== undefined ? { bio: emptyToNull(input.bio) } : {}),
        ...(input.availabilityStatus !== undefined
          ? { availabilityStatus: input.availabilityStatus }
          : {}),
        ...(input.rating !== undefined ? { rating: parseOptionalRating(input.rating) } : {}),
      },
      include: resourceInclude,
    });

    if (skillIds !== undefined) {
      await syncResourceSkills(updated.id, skillIds, tx);
    }

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated resource profile",
        entityType: "Resource",
        entityId: updated.id,
        oldValue: {
          type: existing.type,
          availabilityStatus: existing.availabilityStatus,
        },
        newValue: {
          type: updated.type,
          availabilityStatus: updated.availabilityStatus,
        },
      },
      tx,
    );

    const withSkills = await tx.resource.findFirstOrThrow({
      where: { id: updated.id },
      include: resourceInclude,
    });

    return withSkills;
  });

  return serializeResource(resource);
}

export async function deleteResource(actor: TenantActor, id: string) {
  const existing = await prisma.resource.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: resourceInclude,
  });
  if (!existing) {
    throw new NotFoundError("Resource not found");
  }

  assertCanDeleteResource({
    projectMemberCount: existing._count.projectMembers,
    contractCount: existing._count.contracts,
    bidCount: existing._count.bids,
  });

  await prisma.$transaction(async (tx) => {
    await tx.resourceSkill.deleteMany({ where: { resourceId: existing.id } });
    await tx.resource.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted resource profile",
        entityType: "Resource",
        entityId: existing.id,
        oldValue: {
          userId: existing.userId,
          type: existing.type,
        },
      },
      tx,
    );
  });

  return serializeResource(existing);
}

export async function getResourceSummary(actor: TenantActor) {
  const resources = await prisma.resource.findMany({
    where: { organizationId: actor.organizationId },
    select: { type: true, availabilityStatus: true },
  });

  return {
    total: resources.length,
    employees: resources.filter((row) => row.type === "EMPLOYEE").length,
    freelancers: resources.filter((row) => row.type === "FREELANCER").length,
    availability: ["AVAILABLE", "BUSY", "UNAVAILABLE"].map((status) => ({
      status,
      count: resources.filter((row) => row.availabilityStatus === status).length,
    })),
  };
}
