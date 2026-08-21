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
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import {
  assertCanDeleteExpense,
  assertCanEditExpense,
  assertCanReviewExpense,
  assertCanSubmitExpenseOnProject,
  EXPENSE_STATUSES,
} from "@/modules/expenses/rules";
import type {
  CreateExpenseInput,
  ExpenseListFilter,
  UpdateExpenseInput,
  UpdateExpenseStatusInput,
} from "@/modules/expenses/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
};

const expenseInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      client: { select: { company: { select: { name: true } } } },
    },
  },
  submittedBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.ExpenseInclude;

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

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("Invalid date");
  }
  return date;
}

function canViewAllExpenses(actor: TenantActor) {
  return (
    hasPermission(actor.permissions ?? [], "EXPENSE_UPDATE") ||
    hasPermission(actor.permissions ?? [], "REPORT_VIEW")
  );
}

function canManageExpense(actor: TenantActor, expense: { submittedById: string; status: string }) {
  if (canViewAllExpenses(actor)) {
    return true;
  }
  return expense.submittedById === actor.userId && expense.status === "PENDING";
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
      archivedAt: true,
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
}

export function serializeExpense(
  expense: Prisma.ExpenseGetPayload<{ include: typeof expenseInclude }>,
) {
  return {
    id: expense.id,
    projectId: expense.projectId,
    project: {
      id: expense.project.id,
      name: expense.project.name,
      status: expense.project.status,
      clientName: expense.project.client.company.name,
    },
    category: expense.category,
    description: expense.description,
    amount: moneyString(expense.amount),
    currency: expense.currency,
    date: expense.date,
    submittedById: expense.submittedById,
    submittedBy: expense.submittedBy,
    status: expense.status,
    receiptFileId: expense.receiptFileId,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export type SerializedExpense = ReturnType<typeof serializeExpense>;

function listWhere(actor: TenantActor, filter: ExpenseListFilter): Prisma.ExpenseWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ExpenseWhereInput[] = [];
  const mineOnly = !canViewAllExpenses(actor);
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { submittedBy: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return tenantWhere(actor.organizationId, {
    project: {
      archivedAt: null,
      ...(filter.projectId ? { id: filter.projectId } : {}),
    },
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.category ? { category: filter.category } : {}),
    ...(mineOnly ? { submittedById: actor.userId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listExpenses(actor: TenantActor, filter: ExpenseListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.expense.findMany({
    where,
    include: expenseInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeExpense),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.expense.count({
      where: listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getExpense(actor: TenantActor, id: string) {
  const expense = await prisma.expense.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: expenseInclude,
  });

  if (!expense) {
    throw new NotFoundError("Expense not found");
  }

  if (!canViewAllExpenses(actor) && expense.submittedById !== actor.userId) {
    throw new AuthorizationError("You can only view your own expenses");
  }

  return serializeExpense(expense);
}

export async function listExpenseProjectOptions(actor: TenantActor) {
  return prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      client: { select: { company: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function createExpense(actor: TenantActor, input: CreateExpenseInput) {
  const project = await getTenantProject(actor, input.projectId);
  assertCanSubmitExpenseOnProject(project);

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        organizationId: actor.organizationId,
        projectId: project.id,
        category: input.category,
        description: emptyToNull(input.description),
        amount: parseAmount(input.amount),
        currency: input.currency ?? "USD",
        date: parseDate(input.date),
        submittedById: actor.userId,
        status: "PENDING",
      },
      include: expenseInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Submitted expense",
        entityType: "Expense",
        entityId: created.id,
        newValue: {
          projectId: created.projectId,
          amount: moneyString(created.amount),
          status: created.status,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Expense created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: expense.id,
    operation: "expense.create",
  });

  return serializeExpense(expense);
}

export async function updateExpense(actor: TenantActor, id: string, input: UpdateExpenseInput) {
  const existing = await prisma.expense.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: expenseInclude,
  });
  if (!existing) {
    throw new NotFoundError("Expense not found");
  }
  if (!canManageExpense(actor, existing)) {
    throw new AuthorizationError("You can only update your own pending expenses");
  }
  if (!canViewAllExpenses(actor)) {
    assertCanEditExpense(existing.status);
  }

  const nextProjectId = input.projectId ?? existing.projectId;
  const project = await getTenantProject(actor, nextProjectId);
  assertCanSubmitExpenseOnProject(project);

  const expense = await prisma.$transaction(async (tx) => {
    const updated = await tx.expense.update({
      where: { id: existing.id },
      data: {
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.amount !== undefined ? { amount: parseAmount(input.amount) } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.date !== undefined ? { date: parseDate(input.date) } : {}),
      },
      include: expenseInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated expense",
        entityType: "Expense",
        entityId: updated.id,
        oldValue: { amount: moneyString(existing.amount), status: existing.status },
        newValue: { amount: moneyString(updated.amount), status: updated.status },
      },
      tx,
    );

    return updated;
  });

  return serializeExpense(expense);
}

export async function updateExpenseStatus(
  actor: TenantActor,
  id: string,
  input: UpdateExpenseStatusInput,
) {
  const existing = await prisma.expense.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: expenseInclude,
  });
  if (!existing) {
    throw new NotFoundError("Expense not found");
  }

  if (!hasPermission(actor.permissions ?? [], "EXPENSE_UPDATE")) {
    throw new AuthorizationError("Missing EXPENSE_UPDATE");
  }

  assertCanReviewExpense(existing.status);

  const expense = await prisma.$transaction(async (tx) => {
    const updated = await tx.expense.update({
      where: { id: existing.id },
      data: { status: input.status },
      include: expenseInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: input.status === "APPROVED" ? "Approved expense" : "Rejected expense",
        entityType: "Expense",
        entityId: updated.id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status, amount: moneyString(updated.amount) },
      },
      tx,
    );

    return updated;
  });

  return serializeExpense(expense);
}

export async function deleteExpense(actor: TenantActor, id: string) {
  const existing = await prisma.expense.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: expenseInclude,
  });
  if (!existing) {
    throw new NotFoundError("Expense not found");
  }
  if (!canManageExpense(actor, existing)) {
    throw new AuthorizationError("You can only delete your own pending expenses");
  }
  assertCanDeleteExpense(existing.status);

  await prisma.$transaction(async (tx) => {
    await tx.expense.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted expense",
        entityType: "Expense",
        entityId: existing.id,
        oldValue: {
          projectId: existing.projectId,
          amount: moneyString(existing.amount),
          status: existing.status,
        },
      },
      tx,
    );
  });

  return serializeExpense(existing);
}

export async function getExpenseSummary(actor: TenantActor, projectId?: string) {
  const where = listWhere(actor, { projectId, first: 100, sort: "newest" });
  const expenses = await prisma.expense.findMany({
    where,
    select: { status: true, amount: true },
  });

  const approved = expenses.filter((row) => row.status === "APPROVED");
  const pending = expenses.filter((row) => row.status === "PENDING");

  return {
    total: expenses.length,
    pendingCount: pending.length,
    approvedCount: approved.length,
    rejectedCount: expenses.filter((row) => row.status === "REJECTED").length,
    pendingAmount: pending.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2),
    approvedAmount: approved.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(2),
    stages: EXPENSE_STATUSES.map((status) => ({
      status,
      count: expenses.filter((row) => row.status === status).length,
    })),
  };
}
