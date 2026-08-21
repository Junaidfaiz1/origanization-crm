import { prisma } from "@/lib/prisma/client";
import type { LeadStatus, Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import {
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  assertCanConvertLead,
  conversionNames,
} from "@/modules/leads/rules";
import type { CreateLeadInput, LeadListFilter, UpdateLeadInput } from "@/modules/leads/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const leadInclude = {
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.LeadInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

export function serializeLead(
  lead: Prisma.LeadGetPayload<{ include: typeof leadInclude }>,
) {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    companyName: lead.companyName,
    source: lead.source,
    estimatedValue: moneyString(lead.estimatedValue),
    status: lead.status,
    assignedToId: lead.assignedToId,
    assignedTo: lead.assignedTo,
    notes: lead.notes,
    convertedClientId: lead.convertedClientId,
    archivedAt: lead.archivedAt,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  };
}

export type SerializedLead = ReturnType<typeof serializeLead>;

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

export async function listAssignableUsers(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true, status: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return members
    .filter((member) => member.user.status === "ACTIVE")
    .map((member) => member.user);
}

function listWhere(
  organizationId: string,
  filter: LeadListFilter,
): Prisma.LeadWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.LeadWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
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
    ...(filter.assignedToId ? { assignedToId: filter.assignedToId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listLeads(actor: TenantActor, filter: LeadListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);

  const rows = await prisma.lead.findMany({
    where,
    include: leadInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeLead),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.lead.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getLead(actor: TenantActor, id: string) {
  const lead = await prisma.lead.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: leadInclude,
  });

  if (!lead) {
    throw new NotFoundError("Lead not found");
  }

  return serializeLead(lead);
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

export async function createLead(actor: TenantActor, input: CreateLeadInput) {
  const assignedToId = input.assignedToId ? input.assignedToId : undefined;
  await assertAssigneeInOrg(actor.organizationId, assignedToId);

  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        organizationId: actor.organizationId,
        name: input.name,
        email: emptyToNull(input.email),
        phone: emptyToNull(input.phone),
        companyName: emptyToNull(input.companyName),
        source: emptyToNull(input.source),
        estimatedValue: input.estimatedValue,
        status: (input.status ?? "NEW") as LeadStatus,
        assignedToId: assignedToId ?? null,
        notes: emptyToNull(input.notes),
      },
      include: leadInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created lead",
        entityType: "Lead",
        entityId: created.id,
        newValue: { name: created.name, status: created.status },
      },
      tx,
    );

    return created;
  });

  logger.info("Lead created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: lead.id,
    operation: "lead.create",
  });

  return serializeLead(lead);
}

export async function updateLead(
  actor: TenantActor,
  id: string,
  input: UpdateLeadInput,
) {
  const existing = await prisma.lead.findFirst({
    where: { id, organizationId: actor.organizationId },
  });
  if (!existing) {
    throw new NotFoundError("Lead not found");
  }
  if (existing.archivedAt) {
    throw new BusinessRuleError("Archived leads cannot be edited");
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

  const lead = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: emptyToNull(input.email) } : {}),
        ...(input.phone !== undefined ? { phone: emptyToNull(input.phone) } : {}),
        ...(input.companyName !== undefined
          ? { companyName: emptyToNull(input.companyName) }
          : {}),
        ...(input.source !== undefined ? { source: emptyToNull(input.source) } : {}),
        ...(input.estimatedValue !== undefined
          ? { estimatedValue: input.estimatedValue }
          : {}),
        ...(input.status !== undefined ? { status: input.status as LeadStatus } : {}),
        ...(assignedToId !== undefined ? { assignedToId } : {}),
        ...(input.notes !== undefined ? { notes: emptyToNull(input.notes) } : {}),
      },
      include: leadInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated lead",
        entityType: "Lead",
        entityId: updated.id,
        oldValue: {
          status: existing.status,
          assignedToId: existing.assignedToId,
          estimatedValue: moneyString(existing.estimatedValue),
        },
        newValue: {
          status: updated.status,
          assignedToId: updated.assignedToId,
          estimatedValue: moneyString(updated.estimatedValue),
        },
      },
      tx,
    );

    return updated;
  });

  return serializeLead(lead);
}

export async function archiveLead(actor: TenantActor, id: string) {
  const existing = await prisma.lead.findFirst({
    where: { id, organizationId: actor.organizationId },
  });
  if (!existing) {
    throw new NotFoundError("Lead not found");
  }
  if (existing.archivedAt) {
    return serializeLead(
      await prisma.lead.findFirstOrThrow({
        where: { id: existing.id },
        include: leadInclude,
      }),
    );
  }

  const lead = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
      include: leadInclude,
    });
    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Archived lead",
        entityType: "Lead",
        entityId: updated.id,
      },
      tx,
    );
    return updated;
  });

  return serializeLead(lead);
}

export async function convertLead(actor: TenantActor, id: string) {
  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findFirst({
      where: { id, organizationId: actor.organizationId },
    });
    if (!lead) {
      throw new NotFoundError("Lead not found");
    }

    assertCanConvertLead(lead);

    const locked = await tx.lead.updateMany({
      where: {
        id: lead.id,
        organizationId: actor.organizationId,
        status: { not: "CONVERTED" },
        convertedClientId: null,
        archivedAt: null,
      },
      data: { status: "CONVERTED" },
    });
    if (locked.count !== 1) {
      throw new BusinessRuleError("This lead has already been converted");
    }

    const names = conversionNames(lead);

    const company = await tx.company.create({
      data: {
        organizationId: actor.organizationId,
        name: names.companyName,
      },
    });

    const contact = await tx.contact.create({
      data: {
        organizationId: actor.organizationId,
        companyId: company.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
      },
    });

    const client = await tx.client.create({
      data: {
        organizationId: actor.organizationId,
        companyId: company.id,
        primaryContactId: contact.id,
        status: "ACTIVE",
        notes: lead.notes,
      },
    });

    const opportunity = await tx.opportunity.create({
      data: {
        organizationId: actor.organizationId,
        clientId: client.id,
        name: names.opportunityName,
        estimatedValue: lead.estimatedValue ?? 0,
        probability: 10,
        stage: "NEW",
        assignedToId: lead.assignedToId,
      },
    });

    const converted = await tx.lead.update({
      where: { id: lead.id },
      data: { convertedClientId: client.id, status: "CONVERTED" },
      include: leadInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Converted lead",
        entityType: "Lead",
        entityId: converted.id,
        oldValue: { status: lead.status },
        newValue: {
          status: "CONVERTED",
          clientId: client.id,
          companyId: company.id,
          opportunityId: opportunity.id,
        },
      },
      tx,
    );

    return { lead: converted, clientId: client.id, opportunityId: opportunity.id };
  });

  logger.info("Lead converted", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: result.lead.id,
    operation: "lead.convert",
  });

  return {
    lead: serializeLead(result.lead),
    clientId: result.clientId,
    opportunityId: result.opportunityId,
  };
}
