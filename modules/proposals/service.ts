import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { createNotifications, findClientUserIds } from "@/lib/notifications";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logging/logger";
import { BusinessRuleError, NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import { calculateProposalTotals } from "@/modules/proposals/calculations";
import {
  assertCanAcceptProposal,
  assertCanArchiveProposal,
  assertCanEditProposal,
  assertCanRejectProposal,
  assertCanSendProposal,
} from "@/modules/proposals/rules";
import type {
  CreateProposalInput,
  ProposalListFilter,
  UpdateProposalInput,
} from "@/modules/proposals/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const proposalInclude = {
  opportunity: {
    select: {
      id: true,
      name: true,
    },
  },
  client: {
    select: {
      id: true,
      company: { select: { id: true, name: true } },
    },
  },
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  items: {
    orderBy: { id: "asc" as const },
  },
  _count: {
    select: {
      projects: { where: { archivedAt: null } },
    },
  },
} satisfies Prisma.ProposalInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

export function serializeProposalItem(
  item: Prisma.ProposalItemGetPayload<object>,
) {
  return {
    id: item.id,
    description: item.description,
    quantity: moneyString(item.quantity),
    unitPrice: moneyString(item.unitPrice),
    total: moneyString(item.total),
  };
}

export function serializeProposal(
  proposal: Prisma.ProposalGetPayload<{ include: typeof proposalInclude }>,
) {
  return {
    id: proposal.id,
    opportunityId: proposal.opportunityId,
    opportunity: proposal.opportunity,
    clientId: proposal.clientId,
    client: {
      id: proposal.client.id,
      companyName: proposal.client.company.name,
      companyId: proposal.client.company.id,
    },
    title: proposal.title,
    description: proposal.description,
    subtotal: moneyString(proposal.subtotal),
    discount: moneyString(proposal.discount),
    tax: moneyString(proposal.tax),
    total: moneyString(proposal.total),
    currency: proposal.currency,
    validUntil: proposal.validUntil,
    status: proposal.status,
    createdById: proposal.createdById,
    createdBy: proposal.createdBy,
    sentAt: proposal.sentAt,
    acceptedAt: proposal.acceptedAt,
    rejectedAt: proposal.rejectedAt,
    projectCount: proposal._count.projects,
    items: proposal.items.map(serializeProposalItem),
    archivedAt: proposal.archivedAt,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}

export type SerializedProposal = ReturnType<typeof serializeProposal>;

async function assertActiveOpportunity(actor: TenantActor, opportunityId: string) {
  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: { id: true, clientId: true },
  });

  if (!opportunity) {
    throw new BusinessRuleError("Choose an active opportunity in your organization");
  }

  return opportunity;
}

function buildItemRows(items: CreateProposalInput["items"]) {
  const totals = calculateProposalTotals({
    items,
    discount: 0,
    tax: 0,
  });

  return totals.lineItems.map((line, index) => ({
    description: items[index].description,
    quantity: items[index].quantity,
    unitPrice: items[index].unitPrice,
    total: line.lineTotal,
  }));
}

function listWhere(
  organizationId: string,
  filter: ProposalListFilter,
): Prisma.ProposalWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ProposalWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { client: { company: { name: { contains: search, mode: "insensitive" } } } },
        { opportunity: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return tenantWhere(organizationId, {
    archivedAt: null,
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.clientId ? { clientId: filter.clientId } : {}),
    ...(filter.opportunityId ? { opportunityId: filter.opportunityId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listProposals(actor: TenantActor, filter: ProposalListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.proposal.findMany({
    where,
    include: proposalInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeProposal),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.proposal.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getProposal(actor: TenantActor, id: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: proposalInclude,
  });

  if (!proposal) {
    throw new NotFoundError("Proposal not found");
  }

  return serializeProposal(proposal);
}

export async function listProposalOpportunityOptions(actor: TenantActor) {
  return prisma.opportunity.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null }),
    select: {
      id: true,
      name: true,
      clientId: true,
      client: { select: { company: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listProposalClientOptions(actor: TenantActor) {
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

export async function createProposal(actor: TenantActor, input: CreateProposalInput) {
  const opportunity = await assertActiveOpportunity(actor, input.opportunityId);
  const totals = calculateProposalTotals({
    items: input.items,
    discount: input.discount,
    tax: input.tax,
  });
  const itemRows = buildItemRows(input.items);

  const proposal = await prisma.$transaction(async (tx) => {
    const created = await tx.proposal.create({
      data: {
        organizationId: actor.organizationId,
        opportunityId: opportunity.id,
        clientId: opportunity.clientId,
        title: input.title,
        description: emptyToNull(input.description),
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        currency: input.currency ?? "USD",
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        status: "DRAFT",
        createdById: actor.userId,
        items: {
          create: itemRows,
        },
      },
      include: proposalInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created proposal",
        entityType: "Proposal",
        entityId: created.id,
        newValue: {
          title: created.title,
          total: moneyString(created.total),
          status: created.status,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Proposal created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: proposal.id,
    operation: "proposal.create",
  });

  return serializeProposal(proposal);
}

export async function updateProposal(
  actor: TenantActor,
  id: string,
  input: UpdateProposalInput,
) {
  const existing = await prisma.proposal.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: { items: true, _count: { select: { projects: true } } },
  });
  if (!existing) {
    throw new NotFoundError("Proposal not found");
  }

  assertCanEditProposal({
    status: existing.status,
    archivedAt: existing.archivedAt,
  });

  let clientId = existing.clientId;
  let opportunityId = existing.opportunityId;
  if (input.opportunityId && input.opportunityId !== existing.opportunityId) {
    const opportunity = await assertActiveOpportunity(actor, input.opportunityId);
    clientId = opportunity.clientId;
    opportunityId = opportunity.id;
  }

  const nextItems = input.items ?? existing.items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity.toString()),
    unitPrice: Number(item.unitPrice.toString()),
  }));

  const totals = calculateProposalTotals({
    items: nextItems,
    discount: input.discount ?? Number(existing.discount.toString()),
    tax: input.tax ?? Number(existing.tax.toString()),
  });

  const proposal = await prisma.$transaction(async (tx) => {
    if (input.items) {
      await tx.proposalItem.deleteMany({ where: { proposalId: existing.id } });
    }

    const updated = await tx.proposal.update({
      where: { id: existing.id },
      data: {
        ...(input.opportunityId !== undefined ? { opportunityId, clientId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.discount !== undefined ? { discount: totals.discount } : {}),
        ...(input.tax !== undefined ? { tax: totals.tax } : {}),
        subtotal: totals.subtotal,
        total: totals.total,
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.validUntil !== undefined
          ? {
              validUntil: input.validUntil ? new Date(input.validUntil) : null,
            }
          : {}),
        ...(input.items
          ? {
              items: {
                create: buildItemRows(nextItems),
              },
            }
          : {}),
      },
      include: proposalInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated proposal",
        entityType: "Proposal",
        entityId: updated.id,
        oldValue: {
          title: existing.title,
          total: moneyString(existing.total),
        },
        newValue: {
          title: updated.title,
          total: moneyString(updated.total),
        },
      },
      tx,
    );

    return updated;
  });

  return serializeProposal(proposal);
}

export async function sendProposal(actor: TenantActor, id: string) {
  const existing = await prisma.proposal.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: { items: true },
  });
  if (!existing) {
    throw new NotFoundError("Proposal not found");
  }

  assertCanSendProposal({
    status: existing.status,
    archivedAt: existing.archivedAt,
    itemCount: existing.items.length,
  });

  const proposal = await prisma.$transaction(async (tx) => {
    const updated = await tx.proposal.update({
      where: { id: existing.id },
      data: { status: "SENT", sentAt: new Date() },
      include: proposalInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Sent proposal",
        entityType: "Proposal",
        entityId: updated.id,
      },
      tx,
    );

    const clientUserIds = await findClientUserIds(
      actor.organizationId,
      existing.clientId,
      tx,
    );
    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: clientUserIds,
        excludeUserId: actor.userId,
        type: "PROPOSAL_SENT",
        title: "Proposal ready for review",
        message: `“${updated.title}” was sent for your review.`,
        entityType: "Proposal",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  const clientUsers = await prisma.user.findMany({
    where: {
      id: {
        in: await findClientUserIds(actor.organizationId, existing.clientId),
      },
    },
    select: { email: true },
  });
  for (const user of clientUsers) {
    if (user.email) {
      void emailService.sendProposalEmail(user.email, proposal.title).catch(() => undefined);
    }
  }

  return serializeProposal(proposal);
}

export async function acceptProposal(actor: TenantActor, id: string) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.proposal.findFirst({
      where: { id, organizationId: actor.organizationId },
      include: { items: true, opportunity: true },
    });
    if (!existing) {
      throw new NotFoundError("Proposal not found");
    }

    assertCanAcceptProposal({
      status: existing.status,
      archivedAt: existing.archivedAt,
    });

    const existingProject = await tx.project.findFirst({
      where: { proposalId: existing.id, organizationId: actor.organizationId },
      select: { id: true },
    });
    if (existingProject) {
      throw new BusinessRuleError("A project already exists for this proposal");
    }

    const updated = await tx.proposal.update({
      where: { id: existing.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
      include: proposalInclude,
    });

    await tx.opportunity.update({
      where: { id: existing.opportunityId },
      data: { stage: "WON" },
    });

    const project = await tx.project.create({
      data: {
        organizationId: actor.organizationId,
        clientId: existing.clientId,
        opportunityId: existing.opportunityId,
        proposalId: existing.id,
        name: existing.title,
        description: existing.description,
        budget: existing.total,
        status: "PLANNING",
      },
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Accepted proposal",
        entityType: "Proposal",
        entityId: updated.id,
        newValue: { projectId: project.id },
      },
      tx,
    );

    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: [existing.createdById],
        excludeUserId: actor.userId,
        type: "PROPOSAL_ACCEPTED",
        title: "Proposal accepted",
        message: `“${updated.title}” was accepted.`,
        entityType: "Proposal",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeProposal(result);
}

export async function rejectProposal(actor: TenantActor, id: string) {
  const existing = await prisma.proposal.findFirst({
    where: { id, organizationId: actor.organizationId },
  });
  if (!existing) {
    throw new NotFoundError("Proposal not found");
  }

  assertCanRejectProposal({
    status: existing.status,
    archivedAt: existing.archivedAt,
  });

  const proposal = await prisma.$transaction(async (tx) => {
    const updated = await tx.proposal.update({
      where: { id: existing.id },
      data: { status: "REJECTED", rejectedAt: new Date() },
      include: proposalInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Rejected proposal",
        entityType: "Proposal",
        entityId: updated.id,
      },
      tx,
    );

    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: [existing.createdById],
        excludeUserId: actor.userId,
        type: "PROPOSAL_REJECTED",
        title: "Proposal rejected",
        message: `“${updated.title}” was rejected.`,
        entityType: "Proposal",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeProposal(proposal);
}

export async function archiveProposal(actor: TenantActor, id: string) {
  const existing = await prisma.proposal.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: proposalInclude,
  });
  if (!existing) {
    throw new NotFoundError("Proposal not found");
  }

  assertCanArchiveProposal(existing);

  const proposal = await prisma.$transaction(async (tx) => {
    const updated = await tx.proposal.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
      include: proposalInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Archived proposal",
        entityType: "Proposal",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeProposal(proposal);
}
