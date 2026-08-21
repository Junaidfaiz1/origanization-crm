import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { BusinessRuleError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import {
  assertCanArchiveOpportunity,
  OPEN_OPPORTUNITY_STAGES,
  OPPORTUNITY_STAGES,
} from "@/modules/opportunities/rules";
import type {
  CreateOpportunityInput,
  OpportunityListFilter,
  UpdateOpportunityInput,
} from "@/modules/opportunities/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const opportunityInclude = {
  client: {
    select: {
      id: true,
      company: { select: { id: true, name: true } },
    },
  },
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
  _count: {
    select: {
      proposals: { where: { archivedAt: null } },
      projects: { where: { archivedAt: null } },
    },
  },
} satisfies Prisma.OpportunityInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

function toNumber(value: { toString(): string } | null | undefined) {
  return value ? Number(value.toString()) : 0;
}

export function serializeOpportunity(
  opportunity: Prisma.OpportunityGetPayload<{ include: typeof opportunityInclude }>,
) {
  return {
    id: opportunity.id,
    clientId: opportunity.clientId,
    client: {
      id: opportunity.client.id,
      companyName: opportunity.client.company.name,
      companyId: opportunity.client.company.id,
    },
    name: opportunity.name,
    description: opportunity.description,
    estimatedValue: moneyString(opportunity.estimatedValue),
    probability: opportunity.probability,
    weightedValue: (
      (toNumber(opportunity.estimatedValue) * opportunity.probability) /
      100
    ).toFixed(2),
    expectedCloseDate: opportunity.expectedCloseDate,
    stage: opportunity.stage,
    assignedToId: opportunity.assignedToId,
    assignedTo: opportunity.assignedTo,
    proposalCount: opportunity._count.proposals,
    projectCount: opportunity._count.projects,
    archivedAt: opportunity.archivedAt,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt,
  };
}

export type SerializedOpportunity = ReturnType<typeof serializeOpportunity>;

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

async function assertAssigneeInOrg(
  organizationId: string,
  assignedToId: string | undefined,
) {
  if (!assignedToId) {
    return;
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId: assignedToId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new ValidationError("Assignee must belong to this organization");
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

function listWhere(
  organizationId: string,
  filter: OpportunityListFilter,
): Prisma.OpportunityWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.OpportunityWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { company: { name: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return tenantWhere(organizationId, {
    archivedAt: null,
    ...(filter.stage ? { stage: filter.stage } : {}),
    ...(filter.clientId ? { clientId: filter.clientId } : {}),
    ...(filter.assignedToId ? { assignedToId: filter.assignedToId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listOpportunities(
  actor: TenantActor,
  filter: OpportunityListFilter,
) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.opportunity.findMany({
    where,
    include: opportunityInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeOpportunity),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.opportunity.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function listOpportunitiesForKanban(
  actor: TenantActor,
  filter: OpportunityListFilter,
) {
  const where = listWhere(actor.organizationId, {
    ...filter,
    stage: undefined,
    cursor: undefined,
  });

  const rows = await prisma.opportunity.findMany({
    where,
    include: opportunityInclude,
    orderBy: [{ estimatedValue: "desc" }, { updatedAt: "desc" }],
    take: 200,
  });

  const nodes = rows.map(serializeOpportunity);
  return {
    columns: OPPORTUNITY_STAGES.map((stage) => ({
      stage,
      opportunities: nodes.filter((row) => row.stage === stage),
    })),
    totalCount: nodes.length,
  };
}

export async function getOpportunity(actor: TenantActor, id: string) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: opportunityInclude,
  });

  if (!opportunity) {
    throw new NotFoundError("Opportunity not found");
  }

  return serializeOpportunity(opportunity);
}

export async function listOpportunityClientOptions(actor: TenantActor) {
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

export async function getOpportunityPipelineSummary(actor: TenantActor) {
  const opportunities = await prisma.opportunity.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null }),
    select: {
      stage: true,
      estimatedValue: true,
      probability: true,
    },
  });

  const open = opportunities.filter((row) =>
    OPEN_OPPORTUNITY_STAGES.includes(row.stage as (typeof OPEN_OPPORTUNITY_STAGES)[number]),
  );
  const won = opportunities.filter((row) => row.stage === "WON");
  const lost = opportunities.filter((row) => row.stage === "LOST");
  const closedCount = won.length + lost.length;

  const pipelineValue = open.reduce((sum, row) => sum + toNumber(row.estimatedValue), 0);
  const weightedValue = open.reduce(
    (sum, row) => sum + (toNumber(row.estimatedValue) * row.probability) / 100,
    0,
  );

  return {
    openCount: open.length,
    totalCount: opportunities.length,
    pipelineValue: pipelineValue.toFixed(2),
    weightedValue: weightedValue.toFixed(2),
    winRate: closedCount > 0 ? ((won.length / closedCount) * 100).toFixed(1) : null,
    stages: OPPORTUNITY_STAGES.map((stage) => {
      const rows = opportunities.filter((row) => row.stage === stage);
      const value = rows.reduce((sum, row) => sum + toNumber(row.estimatedValue), 0);
      return {
        stage,
        count: rows.length,
        value: value.toFixed(2),
      };
    }),
  };
}

export async function createOpportunity(
  actor: TenantActor,
  input: CreateOpportunityInput,
) {
  await assertActiveClient(actor, input.clientId);
  const assignedToId = input.assignedToId ? input.assignedToId : undefined;
  await assertAssigneeInOrg(actor.organizationId, assignedToId);

  const opportunity = await prisma.$transaction(async (tx) => {
    const created = await tx.opportunity.create({
      data: {
        organizationId: actor.organizationId,
        clientId: input.clientId,
        name: input.name,
        description: emptyToNull(input.description),
        estimatedValue: input.estimatedValue ?? 0,
        probability: input.probability ?? 0,
        expectedCloseDate: input.expectedCloseDate
          ? new Date(input.expectedCloseDate)
          : null,
        stage: input.stage ?? "NEW",
        assignedToId: assignedToId ?? null,
      },
      include: opportunityInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created opportunity",
        entityType: "Opportunity",
        entityId: created.id,
        newValue: {
          name: created.name,
          clientId: created.clientId,
          stage: created.stage,
          estimatedValue: moneyString(created.estimatedValue),
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Opportunity created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: opportunity.id,
    operation: "opportunity.create",
  });

  return serializeOpportunity(opportunity);
}

export async function updateOpportunity(
  actor: TenantActor,
  id: string,
  input: UpdateOpportunityInput,
) {
  const existing = await prisma.opportunity.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: opportunityInclude,
  });
  if (!existing) {
    throw new NotFoundError("Opportunity not found");
  }
  if (existing.archivedAt) {
    throw new BusinessRuleError("Archived opportunities cannot be edited");
  }

  if (input.clientId && input.clientId !== existing.clientId) {
    await assertActiveClient(actor, input.clientId);
  }

  const assignedToId =
    input.assignedToId === undefined
      ? undefined
      : input.assignedToId
        ? input.assignedToId
        : null;
  if (assignedToId) {
    await assertAssigneeInOrg(actor.organizationId, assignedToId);
  }

  const opportunity = await prisma.$transaction(async (tx) => {
    const updated = await tx.opportunity.update({
      where: { id: existing.id },
      data: {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.estimatedValue !== undefined
          ? { estimatedValue: input.estimatedValue }
          : {}),
        ...(input.probability !== undefined ? { probability: input.probability } : {}),
        ...(input.expectedCloseDate !== undefined
          ? {
              expectedCloseDate: input.expectedCloseDate
                ? new Date(input.expectedCloseDate)
                : null,
            }
          : {}),
        ...(input.stage !== undefined ? { stage: input.stage } : {}),
        ...(assignedToId !== undefined ? { assignedToId } : {}),
      },
      include: opportunityInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated opportunity",
        entityType: "Opportunity",
        entityId: updated.id,
        oldValue: {
          name: existing.name,
          stage: existing.stage,
          estimatedValue: moneyString(existing.estimatedValue),
        },
        newValue: {
          name: updated.name,
          stage: updated.stage,
          estimatedValue: moneyString(updated.estimatedValue),
        },
      },
      tx,
    );

    return updated;
  });

  return serializeOpportunity(opportunity);
}

export async function archiveOpportunity(actor: TenantActor, id: string) {
  const existing = await prisma.opportunity.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: opportunityInclude,
  });
  if (!existing) {
    throw new NotFoundError("Opportunity not found");
  }

  assertCanArchiveOpportunity(existing);

  const opportunity = await prisma.$transaction(async (tx) => {
    const updated = await tx.opportunity.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
      include: opportunityInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Archived opportunity",
        entityType: "Opportunity",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeOpportunity(opportunity);
}
