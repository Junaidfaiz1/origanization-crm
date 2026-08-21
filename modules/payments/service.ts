import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { createNotifications, findClientUserIds } from "@/lib/notifications";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logging/logger";
import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import { applyPayment, roundMoney } from "@/modules/invoices/calculations";
import {
  assertCanRecordPaymentOnInvoice,
  assertCanVoidPayment,
  assertPaymentAmount,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  type PaymentMethodKey,
} from "@/modules/payments/rules";
import type {
  PaymentListFilter,
  RecordPaymentInput,
} from "@/modules/payments/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
};

type PaymentMetadata = {
  method?: PaymentMethodKey;
  notes?: string;
};

const paymentInclude = {
  invoice: {
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      amountPaid: true,
      amountDue: true,
      currency: true,
      client: {
        select: {
          id: true,
          company: { select: { name: true } },
        },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  },
} satisfies Prisma.PaymentInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : "0";
}

function parseAmount(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new ValidationError("Amount must be greater than zero");
  }
  return roundMoney(parsed);
}

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("Invalid date");
  }
  return date;
}

function readMetadata(value: Prisma.JsonValue | null): PaymentMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const method =
    typeof record.method === "string" &&
    PAYMENT_METHODS.includes(record.method as PaymentMethodKey)
      ? (record.method as PaymentMethodKey)
      : undefined;
  const notes = typeof record.notes === "string" ? record.notes : undefined;
  return { method, notes };
}

export function serializePayment(
  payment: Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>,
) {
  const metadata = readMetadata(payment.metadata);
  return {
    id: payment.id,
    invoiceId: payment.invoiceId,
    invoice: {
      id: payment.invoice.id,
      invoiceNumber: payment.invoice.invoiceNumber,
      status: payment.invoice.status,
      total: moneyString(payment.invoice.total),
      amountPaid: moneyString(payment.invoice.amountPaid),
      amountDue: moneyString(payment.invoice.amountDue),
      currency: payment.invoice.currency,
      clientName: payment.invoice.client.company.name,
      clientId: payment.invoice.client.id,
      projectId: payment.invoice.project?.id ?? null,
      projectName: payment.invoice.project?.name ?? null,
    },
    amount: moneyString(payment.amount),
    currency: payment.currency,
    provider: payment.provider,
    providerPaymentId: payment.providerPaymentId,
    status: payment.status,
    method: metadata.method ?? null,
    notes: metadata.notes ?? null,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export type SerializedPayment = ReturnType<typeof serializePayment>;

function listWhere(actor: TenantActor, filter: PaymentListFilter): Prisma.PaymentWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.PaymentWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { providerPaymentId: { contains: search, mode: "insensitive" } },
        { invoice: { invoiceNumber: { contains: search, mode: "insensitive" } } },
        {
          invoice: {
            client: { company: { name: { contains: search, mode: "insensitive" } } },
          },
        },
      ],
    });
  }

  if (filter.method) {
    and.push({
      metadata: {
        path: ["method"],
        equals: filter.method,
      },
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return tenantWhere(actor.organizationId, {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.invoiceId ? { invoiceId: filter.invoiceId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listPayments(actor: TenantActor, filter: PaymentListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.payment.findMany({
    where,
    include: paymentInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializePayment),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.payment.count({
      where: listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getPayment(actor: TenantActor, id: string) {
  const payment = await prisma.payment.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: paymentInclude,
  });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  return serializePayment(payment);
}

export async function listPaymentInvoiceOptions(actor: TenantActor) {
  return prisma.invoice.findMany({
    where: {
      organizationId: actor.organizationId,
      status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
      amountDue: { gt: 0 },
    },
    select: {
      id: true,
      invoiceNumber: true,
      amountDue: true,
      currency: true,
      client: { select: { company: { select: { name: true } } } },
    },
    orderBy: { issueDate: "desc" },
    take: 100,
  });
}

export async function recordPayment(actor: TenantActor, input: RecordPaymentInput) {
  if (!hasPermission(actor.permissions ?? [], "PAYMENT_CREATE")) {
    throw new AuthorizationError("Missing PAYMENT_CREATE");
  }

  const amount = parseAmount(input.amount);
  const paidAt = parseDate(input.paidAt);

  const payment = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: input.invoiceId, organizationId: actor.organizationId },
    });
    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }

    assertCanRecordPaymentOnInvoice({
      status: invoice.status,
      amountDue: Number(invoice.amountDue),
      total: Number(invoice.total),
      amountPaid: Number(invoice.amountPaid),
    });
    assertPaymentAmount(amount, Number(invoice.amountDue));

    let balance;
    try {
      balance = applyPayment(Number(invoice.amountPaid), amount, Number(invoice.total));
    } catch {
      throw new BusinessRuleError("Payment would exceed invoice total");
    }

    const created = await tx.payment.create({
      data: {
        organizationId: actor.organizationId,
        invoiceId: invoice.id,
        amount,
        currency: input.currency ?? invoice.currency,
        provider: "MANUAL",
        providerPaymentId: input.reference ?? null,
        status: "SUCCEEDED",
        paidAt,
        metadata: {
          method: input.method,
          ...(input.notes ? { notes: input.notes } : {}),
        },
      },
      include: paymentInclude,
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: balance.amountPaid,
        amountDue: balance.amountDue,
        status: balance.status,
      },
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Recorded payment",
        entityType: "Payment",
        entityId: created.id,
        newValue: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: moneyString(created.amount),
          method: input.method,
          invoiceStatus: balance.status,
        },
      },
      tx,
    );

    const clientUserIds = await findClientUserIds(
      actor.organizationId,
      invoice.clientId,
      tx,
    );
    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: clientUserIds,
        excludeUserId: actor.userId,
        type: "PAYMENT_RECORDED",
        title: "Payment recorded",
        message: `A payment was recorded for invoice ${invoice.invoiceNumber}.`,
        entityType: "Payment",
        entityId: created.id,
      },
      tx,
    );

    return created;
  });

  logger.info("Payment recorded", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: payment.id,
    operation: "payment.record",
  });

  const clientUsers = await prisma.user.findMany({
    where: {
      id: {
        in: await findClientUserIds(actor.organizationId, payment.invoice.client.id),
      },
    },
    select: { email: true },
  });
  for (const user of clientUsers) {
    if (user.email) {
      void emailService
        .sendPaymentReceipt(user.email, payment.invoice.invoiceNumber)
        .catch(() => undefined);
    }
  }

  return serializePayment(payment);
}

export async function voidPayment(actor: TenantActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "PAYMENT_UPDATE")) {
    throw new AuthorizationError("Missing PAYMENT_UPDATE");
  }

  const payment = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findFirst({
      where: { id, organizationId: actor.organizationId },
      include: paymentInclude,
    });
    if (!existing) {
      throw new NotFoundError("Payment not found");
    }

    assertCanVoidPayment(existing);

    const invoice = await tx.invoice.findFirst({
      where: { id: existing.invoiceId, organizationId: actor.organizationId },
    });
    if (!invoice) {
      throw new NotFoundError("Invoice not found");
    }

    if (invoice.status === "CANCELLED") {
      throw new BusinessRuleError("Cannot void a payment on a cancelled invoice");
    }

    const nextPaid = roundMoney(Number(invoice.amountPaid) - Number(existing.amount));
    if (nextPaid < 0) {
      throw new BusinessRuleError("Voiding this payment would make amount paid negative");
    }

    const nextDue = roundMoney(Number(invoice.total) - nextPaid);
    let nextStatus: "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" = "SENT";
    if (nextPaid === 0) {
      nextStatus =
        invoice.status === "OVERDUE" ||
        (invoice.dueDate && invoice.dueDate < new Date())
          ? "OVERDUE"
          : "SENT";
    } else if (nextPaid < Number(invoice.total)) {
      nextStatus = "PARTIALLY_PAID";
    } else {
      nextStatus = "PAID";
    }

    const updated = await tx.payment.update({
      where: { id: existing.id },
      data: { status: "REFUNDED" },
      include: paymentInclude,
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: nextPaid,
        amountDue: nextDue,
        status: nextStatus,
      },
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Voided payment",
        entityType: "Payment",
        entityId: updated.id,
        oldValue: { status: existing.status, amount: moneyString(existing.amount) },
        newValue: {
          status: updated.status,
          invoiceStatus: nextStatus,
          amountPaid: nextPaid,
        },
      },
      tx,
    );

    return updated;
  });

  return serializePayment(payment);
}

export async function getPaymentSummary(actor: TenantActor, invoiceId?: string) {
  const where = listWhere(actor, { invoiceId, first: 100, sort: "newest" });
  const payments = await prisma.payment.findMany({
    where,
    select: { status: true, amount: true },
  });

  const succeeded = payments.filter((row) => row.status === "SUCCEEDED");
  const refunded = payments.filter((row) => row.status === "REFUNDED");

  return {
    total: payments.length,
    succeededCount: succeeded.length,
    refundedCount: refunded.length,
    succeededAmount: succeeded
      .reduce((sum, row) => sum + Number(row.amount), 0)
      .toFixed(2),
    refundedAmount: refunded
      .reduce((sum, row) => sum + Number(row.amount), 0)
      .toFixed(2),
    stages: PAYMENT_STATUSES.map((status) => ({
      status,
      count: payments.filter((row) => row.status === status).length,
    })),
  };
}
