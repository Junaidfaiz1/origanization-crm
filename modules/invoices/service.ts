import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { createNotifications, findClientUserIds } from "@/lib/notifications";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logging/logger";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  calculateInvoiceTotals,
  roundMoney,
} from "@/modules/invoices/calculations";
import {
  assertCanCancelInvoice,
  assertCanDeleteInvoice,
  assertCanEditInvoice,
  assertCanMarkOverdue,
  assertCanSendInvoice,
  assertClientMatchesProject,
  INVOICE_STATUSES,
} from "@/modules/invoices/rules";
import type {
  CreateInvoiceInput,
  InvoiceListFilter,
  UpdateInvoiceInput,
} from "@/modules/invoices/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
};

const invoiceInclude = {
  client: {
    select: {
      id: true,
      company: { select: { id: true, name: true } },
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      clientId: true,
    },
  },
  items: {
    orderBy: { id: "asc" as const },
  },
  _count: {
    select: { payments: true },
  },
} satisfies Prisma.InvoiceInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : "0";
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("Invalid date");
  }
  return date;
}

function parseOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }
  return parseDate(value);
}

function buildItemRows(items: CreateInvoiceInput["items"]) {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: roundMoney(item.quantity * item.unitPrice),
  }));
}

async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
) {
  const existing = await tx.invoiceSequence.findUnique({
    where: { organizationId },
  });

  if (!existing) {
    await tx.invoiceSequence.create({
      data: { organizationId, lastNumber: 1 },
    });
    return "INV-0001";
  }

  const updated = await tx.invoiceSequence.update({
    where: { organizationId },
    data: { lastNumber: { increment: 1 } },
  });

  return `INV-${String(updated.lastNumber).padStart(4, "0")}`;
}

async function getTenantClient(actor: TenantActor, clientId: string) {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: { id: true },
  });

  if (!client) {
    throw new NotFoundError("Client not found");
  }

  return client;
}

async function getTenantProject(actor: TenantActor, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: { id: true, clientId: true, name: true },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
}

export function serializeInvoiceItem(
  item: Prisma.InvoiceItemGetPayload<object>,
) {
  return {
    id: item.id,
    description: item.description,
    quantity: moneyString(item.quantity),
    unitPrice: moneyString(item.unitPrice),
    total: moneyString(item.total),
  };
}

export function serializeInvoice(
  invoice: Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>,
) {
  return {
    id: invoice.id,
    clientId: invoice.clientId,
    client: {
      id: invoice.client.id,
      companyName: invoice.client.company.name,
      companyId: invoice.client.company.id,
    },
    projectId: invoice.projectId,
    project: invoice.project
      ? {
          id: invoice.project.id,
          name: invoice.project.name,
          status: invoice.project.status,
        }
      : null,
    invoiceNumber: invoice.invoiceNumber,
    subtotal: moneyString(invoice.subtotal),
    discount: moneyString(invoice.discount),
    tax: moneyString(invoice.tax),
    total: moneyString(invoice.total),
    amountPaid: moneyString(invoice.amountPaid),
    amountDue: moneyString(invoice.amountDue),
    currency: invoice.currency,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    status: invoice.status,
    notes: invoice.notes,
    paymentCount: invoice._count.payments,
    items: invoice.items.map(serializeInvoiceItem),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

export type SerializedInvoice = ReturnType<typeof serializeInvoice>;

function listWhere(actor: TenantActor, filter: InvoiceListFilter): Prisma.InvoiceWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.InvoiceWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { client: { company: { name: { contains: search, mode: "insensitive" } } } },
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

  return tenantWhere(actor.organizationId, {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.clientId ? { clientId: filter.clientId } : {}),
    ...(filter.projectId ? { projectId: filter.projectId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listInvoices(actor: TenantActor, filter: InvoiceListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor, filter);

  const rows = await prisma.invoice.findMany({
    where,
    include: invoiceInclude,
    orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeInvoice),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.invoice.count({
      where: listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getInvoice(actor: TenantActor, id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: invoiceInclude,
  });

  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }

  return serializeInvoice(invoice);
}

export async function listInvoiceClientOptions(actor: TenantActor) {
  return prisma.client.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      company: { select: { name: true } },
    },
    orderBy: { company: { name: "asc" } },
    take: 100,
  });
}

export async function listInvoiceProjectOptions(actor: TenantActor, clientId?: string) {
  return prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
      ...(clientId ? { clientId } : {}),
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

export async function createInvoice(actor: TenantActor, input: CreateInvoiceInput) {
  if (!hasPermission(actor.permissions ?? [], "INVOICE_CREATE")) {
    throw new AuthorizationError("Missing INVOICE_CREATE");
  }

  await getTenantClient(actor, input.clientId);

  let projectId: string | null = null;
  if (input.projectId) {
    const project = await getTenantProject(actor, input.projectId);
    assertClientMatchesProject(project.clientId, input.clientId);
    projectId = project.id;
  }

  const totals = calculateInvoiceTotals({
    items: input.items,
    discount: input.discount ?? 0,
    tax: input.tax ?? 0,
  });
  const itemRows = buildItemRows(input.items);
  const issueDate = parseDate(input.issueDate);
  const dueDate = parseOptionalDate(input.dueDate);

  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await allocateInvoiceNumber(tx, actor.organizationId);

    const created = await tx.invoice.create({
      data: {
        organizationId: actor.organizationId,
        clientId: input.clientId,
        projectId,
        invoiceNumber,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        amountPaid: 0,
        amountDue: totals.total,
        currency: input.currency ?? "USD",
        issueDate,
        dueDate,
        status: "DRAFT",
        notes: emptyToNull(input.notes),
        items: {
          create: itemRows,
        },
      },
      include: invoiceInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created invoice",
        entityType: "Invoice",
        entityId: created.id,
        newValue: {
          invoiceNumber: created.invoiceNumber,
          total: moneyString(created.total),
          status: created.status,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Invoice created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: invoice.id,
    operation: "invoice.create",
  });

  return serializeInvoice(invoice);
}

export async function updateInvoice(
  actor: TenantActor,
  id: string,
  input: UpdateInvoiceInput,
) {
  if (!hasPermission(actor.permissions ?? [], "INVOICE_CREATE")) {
    throw new AuthorizationError("Missing INVOICE_CREATE");
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: invoiceInclude,
  });
  if (!existing) {
    throw new NotFoundError("Invoice not found");
  }

  assertCanEditInvoice({
    status: existing.status,
    amountPaid: Number(existing.amountPaid),
  });

  const nextClientId = input.clientId ?? existing.clientId;
  await getTenantClient(actor, nextClientId);

  let nextProjectId =
    input.projectId !== undefined ? emptyToNull(input.projectId) : existing.projectId;

  if (nextProjectId) {
    const project = await getTenantProject(actor, nextProjectId);
    assertClientMatchesProject(project.clientId, nextClientId);
    nextProjectId = project.id;
  }

  const nextItems =
    input.items ??
    existing.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));

  const totals = calculateInvoiceTotals({
    items: nextItems,
    discount: input.discount ?? Number(existing.discount),
    tax: input.tax ?? Number(existing.tax),
  });
  const itemRows = buildItemRows(nextItems);

  const invoice = await prisma.$transaction(async (tx) => {
    if (input.items) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
    }

    const updated = await tx.invoice.update({
      where: { id: existing.id },
      data: {
        clientId: nextClientId,
        projectId: nextProjectId,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        amountDue: totals.total,
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.issueDate !== undefined ? { issueDate: parseDate(input.issueDate) } : {}),
        ...(input.dueDate !== undefined ? { dueDate: parseOptionalDate(input.dueDate) } : {}),
        ...(input.notes !== undefined ? { notes: emptyToNull(input.notes) } : {}),
        ...(input.items
          ? {
              items: {
                create: itemRows,
              },
            }
          : {}),
      },
      include: invoiceInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated invoice",
        entityType: "Invoice",
        entityId: updated.id,
        oldValue: {
          total: moneyString(existing.total),
          status: existing.status,
        },
        newValue: {
          total: moneyString(updated.total),
          status: updated.status,
        },
      },
      tx,
    );

    return updated;
  });

  return serializeInvoice(invoice);
}

export async function sendInvoice(actor: TenantActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "INVOICE_SEND")) {
    throw new AuthorizationError("Missing INVOICE_SEND");
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: invoiceInclude,
  });
  if (!existing) {
    throw new NotFoundError("Invoice not found");
  }

  assertCanSendInvoice({
    status: existing.status,
    itemCount: existing.items.length,
  });

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id: existing.id },
      data: { status: "SENT" },
      include: invoiceInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Sent invoice",
        entityType: "Invoice",
        entityId: updated.id,
        oldValue: { status: existing.status },
        newValue: {
          status: updated.status,
          invoiceNumber: updated.invoiceNumber,
          total: moneyString(updated.total),
        },
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
        type: "INVOICE_SENT",
        title: "Invoice sent",
        message: `Invoice ${updated.invoiceNumber} is ready.`,
        entityType: "Invoice",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  const clientUsers = await prisma.user.findMany({
    where: {
      id: { in: await findClientUserIds(actor.organizationId, existing.clientId) },
    },
    select: { email: true },
  });
  for (const user of clientUsers) {
    if (user.email) {
      void emailService
        .sendInvoiceEmail(user.email, invoice.invoiceNumber)
        .catch(() => undefined);
    }
  }

  return serializeInvoice(invoice);
}

export async function cancelInvoice(actor: TenantActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "INVOICE_UPDATE")) {
    throw new AuthorizationError("Missing INVOICE_UPDATE");
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: invoiceInclude,
  });
  if (!existing) {
    throw new NotFoundError("Invoice not found");
  }

  assertCanCancelInvoice({
    status: existing.status,
    amountPaid: Number(existing.amountPaid),
  });

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
      include: invoiceInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Cancelled invoice",
        entityType: "Invoice",
        entityId: updated.id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status },
      },
      tx,
    );

    return updated;
  });

  return serializeInvoice(invoice);
}

export async function markInvoiceOverdue(actor: TenantActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "INVOICE_UPDATE")) {
    throw new AuthorizationError("Missing INVOICE_UPDATE");
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: invoiceInclude,
  });
  if (!existing) {
    throw new NotFoundError("Invoice not found");
  }

  assertCanMarkOverdue({
    status: existing.status,
    dueDate: existing.dueDate,
  });

  const invoice = await prisma.$transaction(async (tx) => {
    const updated = await tx.invoice.update({
      where: { id: existing.id },
      data: { status: "OVERDUE" },
      include: invoiceInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Marked invoice overdue",
        entityType: "Invoice",
        entityId: updated.id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status },
      },
      tx,
    );

    return updated;
  });

  return serializeInvoice(invoice);
}

export async function deleteInvoice(actor: TenantActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "INVOICE_CREATE")) {
    throw new AuthorizationError("Missing INVOICE_CREATE");
  }

  const existing = await prisma.invoice.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: invoiceInclude,
  });
  if (!existing) {
    throw new NotFoundError("Invoice not found");
  }

  assertCanDeleteInvoice({
    status: existing.status,
    amountPaid: Number(existing.amountPaid),
  });

  await prisma.$transaction(async (tx) => {
    await tx.invoice.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted invoice",
        entityType: "Invoice",
        entityId: existing.id,
        oldValue: {
          invoiceNumber: existing.invoiceNumber,
          total: moneyString(existing.total),
          status: existing.status,
        },
      },
      tx,
    );
  });

  return serializeInvoice(existing);
}

export async function getInvoiceSummary(actor: TenantActor, projectId?: string) {
  const where = listWhere(actor, { projectId, first: 100 });
  const invoices = await prisma.invoice.findMany({
    where,
    select: { status: true, total: true, amountDue: true, amountPaid: true },
  });

  const outstanding = invoices.filter((row) =>
    ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(row.status),
  );
  const draft = invoices.filter((row) => row.status === "DRAFT");
  const paid = invoices.filter((row) => row.status === "PAID");

  return {
    total: invoices.length,
    draftCount: draft.length,
    outstandingCount: outstanding.length,
    paidCount: paid.length,
    outstandingAmount: outstanding
      .reduce((sum, row) => sum + Number(row.amountDue), 0)
      .toFixed(2),
    paidAmount: paid.reduce((sum, row) => sum + Number(row.amountPaid), 0).toFixed(2),
    stages: INVOICE_STATUSES.map((status) => ({
      status,
      count: invoices.filter((row) => row.status === status).length,
    })),
  };
}
