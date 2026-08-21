import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  assertCanDeleteContract,
  assertCanEditContract,
  assertClientMatchesProject,
  assertContractDates,
  assertValidContractStatusTransition,
  CONTRACT_STATUSES,
} from "@/modules/contracts/rules";
import type {
  ContractListFilter,
  CreateContractInput,
  UpdateContractInput,
  UpdateContractStatusInput,
} from "@/modules/contracts/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
};

const contractInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      clientId: true,
      client: { select: { company: { select: { name: true } } } },
    },
  },
  client: {
    select: {
      id: true,
      company: { select: { name: true } },
    },
  },
  resource: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  bid: {
    select: {
      id: true,
      amount: true,
      status: true,
      bidRequestId: true,
    },
  },
} satisfies Prisma.ContractInclude;

function moneyString(value: { toString(): string }) {
  return value.toString();
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function parseAmount(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new ValidationError("Amount must be greater than zero");
  }
  return parsed;
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
      clientId: true,
      archivedAt: true,
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
}

async function getTenantClient(actor: TenantActor, clientId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId: actor.organizationId,
    },
    select: { id: true },
  });

  if (!client) {
    throw new NotFoundError("Client not found");
  }

  return client;
}

async function getTenantResource(actor: TenantActor, resourceId: string) {
  const resource = await prisma.resource.findFirst({
    where: {
      id: resourceId,
      organizationId: actor.organizationId,
    },
    select: { id: true },
  });

  if (!resource) {
    throw new NotFoundError("Resource not found");
  }

  return resource;
}

async function getTenantBid(actor: TenantActor, bidId: string, projectId: string) {
  const bid = await prisma.bid.findFirst({
    where: {
      id: bidId,
      organizationId: actor.organizationId,
      bidRequest: { projectId },
    },
    select: { id: true },
  });

  if (!bid) {
    throw new NotFoundError("Bid not found for this project");
  }

  return bid;
}

async function resolveContractRelations(
  actor: TenantActor,
  input: {
    projectId: string;
    resourceId?: string;
    bidId?: string;
  },
) {
  const project = await getTenantProject(actor, input.projectId);
  await getTenantClient(actor, project.clientId);
  assertClientMatchesProject(project.clientId, project.clientId);

  if (input.resourceId) {
    await getTenantResource(actor, input.resourceId);
  }

  if (input.bidId) {
    await getTenantBid(actor, input.bidId, project.id);
  }

  return project;
}

export function serializeContract(
  contract: Prisma.ContractGetPayload<{ include: typeof contractInclude }>,
) {
  return {
    id: contract.id,
    projectId: contract.projectId,
    project: {
      id: contract.project.id,
      name: contract.project.name,
      status: contract.project.status,
      clientName: contract.project.client.company.name,
    },
    clientId: contract.clientId,
    client: {
      id: contract.client.id,
      name: contract.client.company.name,
    },
    resourceId: contract.resourceId,
    resource: contract.resource
      ? {
          id: contract.resource.id,
          name: contract.resource.user.name,
          email: contract.resource.user.email,
        }
      : null,
    bidId: contract.bidId,
    bid: contract.bid
      ? {
          id: contract.bid.id,
          amount: moneyString(contract.bid.amount),
          status: contract.bid.status,
        }
      : null,
    title: contract.title,
    content: contract.content,
    totalAmount: moneyString(contract.totalAmount),
    currency: contract.currency,
    startDate: contract.startDate,
    endDate: contract.endDate,
    status: contract.status,
    signedAt: contract.signedAt,
    createdAt: contract.createdAt,
    updatedAt: contract.updatedAt,
  };
}

export type SerializedContract = ReturnType<typeof serializeContract>;

function listWhere(actor: TenantActor, filter: ContractListFilter): Prisma.ContractWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ContractWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { client: { company: { name: { contains: search, mode: "insensitive" } } } },
        { resource: { user: { name: { contains: search, mode: "insensitive" } } } },
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

  return tenantWhere(actor.organizationId, {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.projectId ? { projectId: filter.projectId } : {}),
    ...(filter.clientId ? { clientId: filter.clientId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listContracts(actor: TenantActor, filter: ContractListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor, filter);

  const rows = await prisma.contract.findMany({
    where,
    include: contractInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeContract),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.contract.count({
      where: listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getContract(actor: TenantActor, id: string) {
  const contract = await prisma.contract.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: contractInclude,
  });

  if (!contract) {
    throw new NotFoundError("Contract not found");
  }

  return serializeContract(contract);
}

export async function listContractProjectOptions(actor: TenantActor) {
  return prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      clientId: true,
      client: { select: { company: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function listContractResourceOptions(actor: TenantActor) {
  return prisma.resource.findMany({
    where: {
      organizationId: actor.organizationId,
    },
    select: {
      id: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 100,
  });
}

export async function listContractBidOptions(actor: TenantActor, projectId: string) {
  return prisma.bid.findMany({
    where: {
      organizationId: actor.organizationId,
      bidRequest: { projectId },
      status: { in: ["SUBMITTED", "SHORTLISTED", "ACCEPTED"] },
    },
    select: {
      id: true,
      amount: true,
      status: true,
      resource: { select: { user: { select: { name: true } } } },
    },
    orderBy: { amount: "asc" },
    take: 50,
  });
}

export async function createContract(actor: TenantActor, input: CreateContractInput) {
  if (!hasPermission(actor.permissions ?? [], "CONTRACT_CREATE")) {
    throw new AuthorizationError("Missing CONTRACT_CREATE");
  }

  const project = await resolveContractRelations(actor, input);
  const startDate = parseOptionalDate(input.startDate);
  const endDate = parseOptionalDate(input.endDate);
  assertContractDates(startDate, endDate);

  const contract = await prisma.$transaction(async (tx) => {
    const created = await tx.contract.create({
      data: {
        organizationId: actor.organizationId,
        projectId: project.id,
        clientId: project.clientId,
        resourceId: emptyToNull(input.resourceId) ?? null,
        bidId: emptyToNull(input.bidId) ?? null,
        title: input.title,
        content: emptyToNull(input.content),
        totalAmount: parseAmount(input.totalAmount),
        currency: input.currency ?? "USD",
        startDate,
        endDate,
        status: "DRAFT",
      },
      include: contractInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created contract",
        entityType: "Contract",
        entityId: created.id,
        newValue: {
          projectId: created.projectId,
          title: created.title,
          status: created.status,
          totalAmount: moneyString(created.totalAmount),
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Contract created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: contract.id,
    operation: "contract.create",
  });

  return serializeContract(contract);
}

export async function updateContract(
  actor: TenantActor,
  id: string,
  input: UpdateContractInput,
) {
  if (!hasPermission(actor.permissions ?? [], "CONTRACT_CREATE")) {
    throw new AuthorizationError("Missing CONTRACT_CREATE");
  }

  const existing = await prisma.contract.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: contractInclude,
  });
  if (!existing) {
    throw new NotFoundError("Contract not found");
  }

  assertCanEditContract(existing.status);

  const nextProjectId = input.projectId ?? existing.projectId;
  const project = await resolveContractRelations(actor, {
    projectId: nextProjectId,
    resourceId: input.resourceId ?? existing.resourceId ?? undefined,
    bidId: input.bidId ?? existing.bidId ?? undefined,
  });

  const startDate =
    input.startDate !== undefined ? parseOptionalDate(input.startDate) : existing.startDate;
  const endDate =
    input.endDate !== undefined ? parseOptionalDate(input.endDate) : existing.endDate;
  assertContractDates(startDate, endDate);

  const contract = await prisma.$transaction(async (tx) => {
    const updated = await tx.contract.update({
      where: { id: existing.id },
      data: {
        ...(input.projectId !== undefined
          ? { projectId: project.id, clientId: project.clientId }
          : {}),
        ...(input.resourceId !== undefined
          ? { resourceId: emptyToNull(input.resourceId) ?? null }
          : {}),
        ...(input.bidId !== undefined ? { bidId: emptyToNull(input.bidId) ?? null } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: emptyToNull(input.content) } : {}),
        ...(input.totalAmount !== undefined
          ? { totalAmount: parseAmount(input.totalAmount) }
          : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.startDate !== undefined ? { startDate } : {}),
        ...(input.endDate !== undefined ? { endDate } : {}),
      },
      include: contractInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated contract",
        entityType: "Contract",
        entityId: updated.id,
        oldValue: {
          title: existing.title,
          status: existing.status,
          totalAmount: moneyString(existing.totalAmount),
        },
        newValue: {
          title: updated.title,
          status: updated.status,
          totalAmount: moneyString(updated.totalAmount),
        },
      },
      tx,
    );

    return updated;
  });

  return serializeContract(contract);
}

export async function updateContractStatus(
  actor: TenantActor,
  id: string,
  input: UpdateContractStatusInput,
) {
  if (!hasPermission(actor.permissions ?? [], "CONTRACT_UPDATE")) {
    throw new AuthorizationError("Missing CONTRACT_UPDATE");
  }

  const existing = await prisma.contract.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: contractInclude,
  });
  if (!existing) {
    throw new NotFoundError("Contract not found");
  }

  assertValidContractStatusTransition(existing.status, input.status);

  const contract = await prisma.$transaction(async (tx) => {
    const updated = await tx.contract.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        ...(input.status === "SIGNED" && !existing.signedAt
          ? { signedAt: new Date() }
          : {}),
      },
      include: contractInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: `Contract status → ${input.status}`,
        entityType: "Contract",
        entityId: updated.id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status, title: updated.title },
      },
      tx,
    );

    return updated;
  });

  return serializeContract(contract);
}

export async function deleteContract(actor: TenantActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "CONTRACT_CREATE")) {
    throw new AuthorizationError("Missing CONTRACT_CREATE");
  }

  const existing = await prisma.contract.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: contractInclude,
  });
  if (!existing) {
    throw new NotFoundError("Contract not found");
  }

  assertCanDeleteContract(existing.status);

  await prisma.$transaction(async (tx) => {
    await tx.contract.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted contract",
        entityType: "Contract",
        entityId: existing.id,
        oldValue: {
          projectId: existing.projectId,
          title: existing.title,
          status: existing.status,
        },
      },
      tx,
    );
  });

  return serializeContract(existing);
}

export async function getContractSummary(actor: TenantActor, projectId?: string) {
  const where = listWhere(actor, { projectId, first: 100 });
  const contracts = await prisma.contract.findMany({
    where,
    select: { status: true, totalAmount: true },
  });

  const active = contracts.filter((row) => row.status === "ACTIVE");
  const draft = contracts.filter((row) => row.status === "DRAFT");

  return {
    total: contracts.length,
    draftCount: draft.length,
    activeCount: active.length,
    signedCount: contracts.filter((row) => row.status === "SIGNED").length,
    completedCount: contracts.filter((row) => row.status === "COMPLETED").length,
    activeAmount: active.reduce((sum, row) => sum + Number(row.totalAmount), 0).toFixed(2),
    draftAmount: draft.reduce((sum, row) => sum + Number(row.totalAmount), 0).toFixed(2),
    stages: CONTRACT_STATUSES.map((status) => ({
      status,
      count: contracts.filter((row) => row.status === status).length,
    })),
  };
}
