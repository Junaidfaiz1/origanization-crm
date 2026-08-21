import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  ACTIVE_PROJECT_STATUSES,
  assertCanArchiveProject,
  assertCanEditProject,
  PROJECT_STATUSES,
} from "@/modules/projects/rules";
import type {
  CreateProjectInput,
  ProjectListFilter,
  UpdateProjectInput,
} from "@/modules/projects/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const projectInclude = {
  client: {
    select: {
      id: true,
      company: { select: { id: true, name: true } },
    },
  },
  opportunity: {
    select: { id: true, name: true },
  },
  proposal: {
    select: { id: true, title: true },
  },
  manager: {
    select: { id: true, name: true, email: true },
  },
  _count: {
    select: {
      bidRequests: true,
      milestones: true,
      tasks: true,
      members: true,
    },
  },
} satisfies Prisma.ProjectInclude;

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

export function serializeProject(
  project: Prisma.ProjectGetPayload<{ include: typeof projectInclude }>,
) {
  return {
    id: project.id,
    clientId: project.clientId,
    client: {
      id: project.client.id,
      companyName: project.client.company.name,
      companyId: project.client.company.id,
    },
    opportunityId: project.opportunityId,
    opportunity: project.opportunity,
    proposalId: project.proposalId,
    proposal: project.proposal
      ? { id: project.proposal.id, title: project.proposal.title }
      : null,
    name: project.name,
    description: project.description,
    budget: moneyString(project.budget),
    estimatedCost: moneyString(project.estimatedCost),
    actualCost: moneyString(project.actualCost),
    startDate: project.startDate,
    endDate: project.endDate,
    status: project.status,
    managerId: project.managerId,
    manager: project.manager,
    bidRequestCount: project._count.bidRequests,
    milestoneCount: project._count.milestones,
    taskCount: project._count.tasks,
    memberCount: project._count.members,
    archivedAt: project.archivedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export type SerializedProject = ReturnType<typeof serializeProject>;

async function assertManagerInOrg(
  organizationId: string,
  managerId: string | undefined,
) {
  if (!managerId) {
    return;
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId: managerId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new ValidationError("Manager must belong to this organization");
  }
}

async function assertActiveClient(actor: TenantActor, clientId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!client) {
    throw new BusinessRuleError("Choose an active client in your organization");
  }

  return client;
}

async function assertOpportunityLink(
  actor: TenantActor,
  clientId: string,
  opportunityId: string | undefined,
) {
  if (!opportunityId) {
    return null;
  }

  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      organizationId: actor.organizationId,
      clientId,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!opportunity) {
    throw new BusinessRuleError("Opportunity must belong to the selected client");
  }

  return opportunity;
}

async function assertProposalLink(
  actor: TenantActor,
  clientId: string,
  proposalId: string | undefined,
) {
  if (!proposalId) {
    return null;
  }

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      organizationId: actor.organizationId,
      clientId,
      archivedAt: null,
    },
    select: { id: true, opportunityId: true },
  });

  if (!proposal) {
    throw new BusinessRuleError("Proposal must belong to the selected client");
  }

  const existingProject = await prisma.project.findFirst({
    where: {
      proposalId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (existingProject) {
    throw new BusinessRuleError("A project already exists for this proposal");
  }

  return proposal;
}

function listWhere(
  organizationId: string,
  filter: ProjectListFilter,
): Prisma.ProjectWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ProjectWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { company: { name: { contains: search, mode: "insensitive" } } } },
        { manager: { name: { contains: search, mode: "insensitive" } } },
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

  return tenantWhere(organizationId, {
    archivedAt: null,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.clientId ? { clientId: filter.clientId } : {}),
    ...(filter.managerId ? { managerId: filter.managerId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listProjects(actor: TenantActor, filter: ProjectListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);

  const rows = await prisma.project.findMany({
    where,
    include: projectInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeProject),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.project.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getProject(actor: TenantActor, id: string) {
  const project = await prisma.project.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: projectInclude,
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return serializeProject(project);
}

export async function findProjectByProposalId(actor: TenantActor, proposalId: string) {
  const project = await prisma.project.findFirst({
    where: {
      proposalId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: { id: true, name: true },
  });

  return project;
}

export async function listProjectClientOptions(actor: TenantActor) {
  return prisma.client.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null }),
    select: {
      id: true,
      company: { select: { name: true } },
    },
    orderBy: { company: { name: "asc" } },
    take: 100,
  });
}

export async function listProjectOpportunityOptions(actor: TenantActor, clientId?: string) {
  return prisma.opportunity.findMany({
    where: tenantWhere(actor.organizationId, {
      archivedAt: null,
      ...(clientId ? { clientId } : {}),
    }),
    select: { id: true, name: true, clientId: true },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function listProjectProposalOptions(actor: TenantActor, clientId?: string) {
  const linkedProposalIds = await prisma.project.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null, proposalId: { not: null } }),
    select: { proposalId: true },
  });

  const excludeIds = linkedProposalIds
    .map((row) => row.proposalId)
    .filter((id): id is string => Boolean(id));

  return prisma.proposal.findMany({
    where: tenantWhere(actor.organizationId, {
      archivedAt: null,
      status: "ACCEPTED" as const,
      ...(clientId ? { clientId } : {}),
      ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
    }),
    select: { id: true, title: true, clientId: true, opportunityId: true },
    orderBy: { title: "asc" },
    take: 100,
  });
}

export async function createProject(actor: TenantActor, input: CreateProjectInput) {
  await assertActiveClient(actor, input.clientId);
  await assertManagerInOrg(actor.organizationId, emptyToNull(input.managerId) ?? undefined);

  const opportunityId = emptyToNull(input.opportunityId);
  const proposalId = emptyToNull(input.proposalId);

  await assertOpportunityLink(actor, input.clientId, opportunityId ?? undefined);
  const proposal = await assertProposalLink(actor, input.clientId, proposalId ?? undefined);

  const resolvedOpportunityId =
    opportunityId ?? proposal?.opportunityId ?? null;

  if (proposal && opportunityId && proposal.opportunityId !== opportunityId) {
    throw new BusinessRuleError("Proposal does not match the selected opportunity");
  }

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        organizationId: actor.organizationId,
        clientId: input.clientId,
        opportunityId: resolvedOpportunityId,
        proposalId,
        name: input.name,
        description: emptyToNull(input.description),
        budget: parseOptionalDecimal(input.budget),
        estimatedCost: parseOptionalDecimal(input.estimatedCost),
        actualCost: parseOptionalDecimal(input.actualCost),
        startDate: parseOptionalDate(input.startDate),
        endDate: parseOptionalDate(input.endDate),
        status: input.status ?? "PLANNING",
        managerId: emptyToNull(input.managerId),
      },
      include: projectInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created project",
        entityType: "Project",
        entityId: created.id,
        newValue: {
          clientId: created.clientId,
          status: created.status,
          name: created.name,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Project created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: project.id,
    operation: "project.create",
  });

  return serializeProject(project);
}

export async function updateProject(
  actor: TenantActor,
  id: string,
  input: UpdateProjectInput,
) {
  const existing = await prisma.project.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: projectInclude,
  });
  if (!existing) {
    throw new NotFoundError("Project not found");
  }

  assertCanEditProject(existing);

  const nextClientId = input.clientId ?? existing.clientId;
  if (input.clientId && input.clientId !== existing.clientId) {
    await assertActiveClient(actor, input.clientId);
  }

  const nextManagerId =
    input.managerId !== undefined ? emptyToNull(input.managerId) : existing.managerId;

  if (input.managerId !== undefined) {
    await assertManagerInOrg(actor.organizationId, nextManagerId ?? undefined);
  }

  const nextOpportunityId =
    input.opportunityId !== undefined
      ? emptyToNull(input.opportunityId)
      : existing.opportunityId;
  const nextProposalId =
    input.proposalId !== undefined ? emptyToNull(input.proposalId) : existing.proposalId;

  if (input.opportunityId !== undefined) {
    await assertOpportunityLink(actor, nextClientId, nextOpportunityId ?? undefined);
  }

  if (input.proposalId !== undefined && nextProposalId) {
    const linkedElsewhere = await prisma.project.findFirst({
      where: {
        proposalId: nextProposalId,
        organizationId: actor.organizationId,
        archivedAt: null,
        NOT: { id: existing.id },
      },
      select: { id: true },
    });
    if (linkedElsewhere) {
      throw new BusinessRuleError("A project already exists for this proposal");
    }

    const proposal = await prisma.proposal.findFirst({
      where: {
        id: nextProposalId,
        organizationId: actor.organizationId,
        clientId: nextClientId,
        archivedAt: null,
      },
      select: { id: true, opportunityId: true },
    });
    if (!proposal) {
      throw new BusinessRuleError("Proposal must belong to the selected client");
    }
    if (nextOpportunityId && proposal.opportunityId !== nextOpportunityId) {
      throw new BusinessRuleError("Proposal does not match the selected opportunity");
    }
  }

  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: existing.id },
      data: {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.opportunityId !== undefined ? { opportunityId: nextOpportunityId } : {}),
        ...(input.proposalId !== undefined ? { proposalId: nextProposalId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.budget !== undefined ? { budget: parseOptionalDecimal(input.budget) } : {}),
        ...(input.estimatedCost !== undefined
          ? { estimatedCost: parseOptionalDecimal(input.estimatedCost) }
          : {}),
        ...(input.actualCost !== undefined
          ? { actualCost: parseOptionalDecimal(input.actualCost) }
          : {}),
        ...(input.startDate !== undefined
          ? { startDate: parseOptionalDate(input.startDate) }
          : {}),
        ...(input.endDate !== undefined ? { endDate: parseOptionalDate(input.endDate) } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.managerId !== undefined ? { managerId: nextManagerId } : {}),
      },
      include: projectInclude,
    });

    const statusChanged = input.status !== undefined && input.status !== existing.status;

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: statusChanged ? "Updated project status" : "Updated project",
        entityType: "Project",
        entityId: updated.id,
        oldValue: {
          status: existing.status,
          name: existing.name,
          managerId: existing.managerId,
        },
        newValue: {
          status: updated.status,
          name: updated.name,
          managerId: updated.managerId,
        },
      },
      tx,
    );

    return updated;
  });

  return serializeProject(project);
}

export async function archiveProject(actor: TenantActor, id: string) {
  const existing = await prisma.project.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: projectInclude,
  });
  if (!existing) {
    throw new NotFoundError("Project not found");
  }

  assertCanArchiveProject(existing);

  const project = await prisma.$transaction(async (tx) => {
    const updated = await tx.project.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
      include: projectInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Archived project",
        entityType: "Project",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeProject(project);
}

export async function getProjectStatusSummary(actor: TenantActor) {
  const projects = await prisma.project.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null }),
    select: { status: true },
  });

  const activeCount = projects.filter((row) =>
    ACTIVE_PROJECT_STATUSES.includes(row.status as (typeof ACTIVE_PROJECT_STATUSES)[number]),
  ).length;

  return {
    total: projects.length,
    activeCount,
    stages: PROJECT_STATUSES.map((status) => ({
      status,
      count: projects.filter((row) => row.status === status).length,
    })),
  };
}
