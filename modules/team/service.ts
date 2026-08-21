import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { ConflictError, NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import { isNewestFirst } from "@/lib/ui/list-sort";
import {
  assertCanManageTeam,
  shouldMarkResourceAssigned,
} from "@/modules/team/rules";
import type {
  AssignTeamMemberInput,
  TeamListFilter,
  UpdateTeamMemberInput,
} from "@/modules/team/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const memberInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      archivedAt: true,
      client: {
        select: {
          id: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
  },
  resource: {
    select: {
      id: true,
      type: true,
      availabilityStatus: true,
      hourlyRate: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
} satisfies Prisma.ProjectMemberInclude;

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

export function serializeTeamMember(
  member: Prisma.ProjectMemberGetPayload<{ include: typeof memberInclude }>,
) {
  return {
    id: member.id,
    organizationId: member.organizationId,
    projectId: member.projectId,
    project: {
      id: member.project.id,
      name: member.project.name,
      status: member.project.status,
      clientId: member.project.client.id,
      clientName: member.project.client.company.name,
    },
    resourceId: member.resourceId,
    resource: {
      id: member.resource.id,
      type: member.resource.type,
      availabilityStatus: member.resource.availabilityStatus,
      hourlyRate: moneyString(member.resource.hourlyRate),
      user: member.resource.user,
    },
    role: member.role,
    assignedAt: member.assignedAt,
  };
}

export type SerializedTeamMember = ReturnType<typeof serializeTeamMember>;

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

async function getTenantResource(actor: TenantActor, resourceId: string) {
  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      organizationId: actor.organizationId,
    },
    select: {
      id: true,
      type: true,
      user: { select: { id: true, name: true } },
    },
  });

  if (!resource) {
    throw new NotFoundError("Resource not found");
  }

  return resource;
}

async function getTenantMember(actor: TenantActor, id: string) {
  const member = await prisma.projectMember.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
      project: { organizationId: actor.organizationId },
    },
    include: memberInclude,
  });

  if (!member) {
    throw new NotFoundError("Team assignment not found");
  }

  return member;
}

function listWhere(
  organizationId: string,
  filter: TeamListFilter,
): Prisma.ProjectMemberWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ProjectMemberWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { role: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { resource: { user: { name: { contains: search, mode: "insensitive" } } } },
        { resource: { user: { email: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  if (decoded) {
    and.push({
      OR: newestFirst
        ? [
            { assignedAt: { lt: decoded.createdAt } },
            {
              AND: [{ assignedAt: decoded.createdAt }, { id: { lt: decoded.id } }],
            },
          ]
        : [
            { assignedAt: { gt: decoded.createdAt } },
            {
              AND: [{ assignedAt: decoded.createdAt }, { id: { gt: decoded.id } }],
            },
          ],
    });
  }

  return {
    organizationId,
    project: {
      organizationId,
      archivedAt: null,
      ...(filter.projectId ? { id: filter.projectId } : {}),
    },
    ...(filter.resourceId ? { resourceId: filter.resourceId } : {}),
    ...(filter.type ? { resource: { type: filter.type } } : {}),
    ...(and.length ? { AND: and } : {}),
  };
}

export async function listTeamMembers(actor: TenantActor, filter: TeamListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.projectMember.findMany({
    where,
    include: memberInclude,
    orderBy: newestFirst
      ? [{ assignedAt: "desc" }, { id: "desc" }]
      : [{ assignedAt: "asc" }, { id: "asc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeTeamMember),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.assignedAt, end.id) : null,
    },
    totalCount: await prisma.projectMember.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getTeamMember(actor: TenantActor, id: string) {
  const member = await getTenantMember(actor, id);
  return serializeTeamMember(member);
}

export async function listTeamProjectOptions(actor: TenantActor) {
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

export async function listAssignableResources(
  actor: TenantActor,
  projectId?: string,
) {
  const assignedIds =
    projectId != null
      ? (
          await prisma.projectMember.findMany({
            where: {
              organizationId: actor.organizationId,
              projectId,
            },
            select: { resourceId: true },
          })
        ).map((row) => row.resourceId)
      : [];

  return prisma.resource.findMany({
    where: {
      organizationId: actor.organizationId,
      ...(assignedIds.length ? { id: { notIn: assignedIds } } : {}),
    },
    select: {
      id: true,
      type: true,
      availabilityStatus: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 100,
  });
}

export async function assignTeamMember(
  actor: TenantActor,
  input: AssignTeamMemberInput,
) {
  const project = await getTenantProject(actor, input.projectId);
  assertCanManageTeam(project);
  const resource = await getTenantResource(actor, input.resourceId);

  const existing = await prisma.projectMember.findFirst({
    where: {
      projectId: project.id,
      resourceId: resource.id,
    },
    select: { id: true },
  });
  if (existing) {
    throw new ConflictError("This resource is already assigned to the project");
  }

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.projectMember.create({
      data: {
        organizationId: actor.organizationId,
        projectId: project.id,
        resourceId: resource.id,
        role: emptyToNull(input.role),
      },
      include: memberInclude,
    });

    if (shouldMarkResourceAssigned(project.status)) {
      await tx.project.update({
        where: { id: project.id },
        data: { status: "RESOURCE_ASSIGNED" },
      });
    }

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Assigned team member",
        entityType: "ProjectMember",
        entityId: created.id,
        newValue: {
          projectId: created.projectId,
          resourceId: created.resourceId,
          role: created.role,
          projectStatusUpdated: shouldMarkResourceAssigned(project.status),
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Team member assigned", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: member.id,
    operation: "team.assign",
  });

  return serializeTeamMember(member);
}

export async function updateTeamMember(
  actor: TenantActor,
  id: string,
  input: UpdateTeamMemberInput,
) {
  const existing = await getTenantMember(actor, id);
  assertCanManageTeam(existing.project);

  const member = await prisma.$transaction(async (tx) => {
    const updated = await tx.projectMember.update({
      where: { id: existing.id },
      data: { role: emptyToNull(input.role || undefined) },
      include: memberInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated team member role",
        entityType: "ProjectMember",
        entityId: updated.id,
        oldValue: { role: existing.role },
        newValue: { role: updated.role },
      },
      tx,
    );

    return updated;
  });

  return serializeTeamMember(member);
}

export async function removeTeamMember(actor: TenantActor, id: string) {
  const existing = await getTenantMember(actor, id);
  assertCanManageTeam(existing.project);

  await prisma.$transaction(async (tx) => {
    await tx.projectMember.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Removed team member",
        entityType: "ProjectMember",
        entityId: existing.id,
        oldValue: {
          projectId: existing.projectId,
          resourceId: existing.resourceId,
          role: existing.role,
        },
      },
      tx,
    );
  });

  return serializeTeamMember(existing);
}

export async function getTeamSummary(actor: TenantActor, projectId?: string) {
  const where: Prisma.ProjectMemberWhereInput = {
    organizationId: actor.organizationId,
    project: {
      organizationId: actor.organizationId,
      archivedAt: null,
      ...(projectId ? { id: projectId } : {}),
    },
  };

  const members = await prisma.projectMember.findMany({
    where,
    select: {
      resource: { select: { type: true } },
    },
  });

  return {
    total: members.length,
    employeeCount: members.filter((row) => row.resource.type === "EMPLOYEE").length,
    freelancerCount: members.filter((row) => row.resource.type === "FREELANCER")
      .length,
  };
}
