import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { BusinessRuleError, NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import { assertCanArchiveClient } from "@/modules/clients/rules";
import type {
  ClientListFilter,
  CreateClientInput,
  UpdateClientInput,
} from "@/modules/clients/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const clientInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  primaryContact: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  _count: {
    select: {
      opportunities: { where: { archivedAt: null } },
      projects: { where: { archivedAt: null } },
      proposals: { where: { archivedAt: null } },
    },
  },
} satisfies Prisma.ClientInclude;

export function serializeClient(
  client: Prisma.ClientGetPayload<{ include: typeof clientInclude }>,
) {
  return {
    id: client.id,
    companyId: client.companyId,
    company: client.company,
    primaryContactId: client.primaryContactId,
    primaryContact: client.primaryContact,
    status: client.status,
    notes: client.notes,
    opportunityCount: client._count.opportunities,
    projectCount: client._count.projects,
    proposalCount: client._count.proposals,
    archivedAt: client.archivedAt,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  };
}

export type SerializedClient = ReturnType<typeof serializeClient>;

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

async function assertActiveCompany(actor: TenantActor, companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, organizationId: actor.organizationId, archivedAt: null },
    select: { id: true },
  });

  if (!company) {
    throw new BusinessRuleError("Choose an active company in your organization");
  }

  return company;
}

async function assertPrimaryContact(
  actor: TenantActor,
  companyId: string,
  primaryContactId: string | undefined,
) {
  if (!primaryContactId) {
    return null;
  }

  const contact = await prisma.contact.findFirst({
    where: {
      id: primaryContactId,
      organizationId: actor.organizationId,
      companyId,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!contact) {
    throw new BusinessRuleError("Primary contact must belong to the selected company");
  }

  return contact;
}

function listWhere(
  organizationId: string,
  filter: ClientListFilter,
): Prisma.ClientWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ClientWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { company: { name: { contains: search, mode: "insensitive" } } },
        { primaryContact: { name: { contains: search, mode: "insensitive" } } },
        { primaryContact: { email: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
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
    ...(filter.companyId ? { companyId: filter.companyId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listClients(actor: TenantActor, filter: ClientListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);

  const rows = await prisma.client.findMany({
    where,
    include: clientInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeClient),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.client.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getClient(actor: TenantActor, id: string) {
  const client = await prisma.client.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: clientInclude,
  });

  if (!client) {
    throw new NotFoundError("Client not found");
  }

  return serializeClient(client);
}

export async function listClientCompanyOptions(actor: TenantActor) {
  return prisma.company.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null }),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function listClientContactOptions(actor: TenantActor) {
  return prisma.contact.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null }),
    select: { id: true, name: true, companyId: true },
    orderBy: { name: "asc" },
    take: 200,
  });
}

export async function createClient(actor: TenantActor, input: CreateClientInput) {
  await assertActiveCompany(actor, input.companyId);
  await assertPrimaryContact(actor, input.companyId, input.primaryContactId);

  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        organizationId: actor.organizationId,
        companyId: input.companyId,
        primaryContactId: emptyToNull(input.primaryContactId),
        status: input.status ?? "ACTIVE",
        notes: emptyToNull(input.notes),
      },
      include: clientInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created client",
        entityType: "Client",
        entityId: created.id,
        newValue: {
          companyId: created.companyId,
          status: created.status,
          primaryContactId: created.primaryContactId,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Client created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: client.id,
    operation: "client.create",
  });

  return serializeClient(client);
}

export async function updateClient(
  actor: TenantActor,
  id: string,
  input: UpdateClientInput,
) {
  const existing = await prisma.client.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: clientInclude,
  });
  if (!existing) {
    throw new NotFoundError("Client not found");
  }
  if (existing.archivedAt) {
    throw new BusinessRuleError("Archived clients cannot be edited");
  }

  const nextCompanyId = input.companyId ?? existing.companyId;
  if (input.companyId && input.companyId !== existing.companyId) {
    await assertActiveCompany(actor, input.companyId);
  }

  const nextPrimaryContactId =
    input.primaryContactId !== undefined
      ? emptyToNull(input.primaryContactId)
      : existing.primaryContactId;

  if (nextPrimaryContactId) {
    await assertPrimaryContact(actor, nextCompanyId, nextPrimaryContactId);
  }

  const client = await prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id: existing.id },
      data: {
        ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
        ...(input.primaryContactId !== undefined
          ? { primaryContactId: emptyToNull(input.primaryContactId) }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.notes !== undefined ? { notes: emptyToNull(input.notes) } : {}),
      },
      include: clientInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated client",
        entityType: "Client",
        entityId: updated.id,
        oldValue: {
          companyId: existing.companyId,
          status: existing.status,
          primaryContactId: existing.primaryContactId,
        },
        newValue: {
          companyId: updated.companyId,
          status: updated.status,
          primaryContactId: updated.primaryContactId,
        },
      },
      tx,
    );

    return updated;
  });

  return serializeClient(client);
}

export async function archiveClient(actor: TenantActor, id: string) {
  const existing = await prisma.client.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: clientInclude,
  });
  if (!existing) {
    throw new NotFoundError("Client not found");
  }

  assertCanArchiveClient(existing);

  const client = await prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
      include: clientInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Archived client",
        entityType: "Client",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeClient(client);
}
