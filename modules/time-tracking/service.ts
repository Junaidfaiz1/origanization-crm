import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import {
  AuthorizationError,
  BusinessRuleError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  assertCanLogTimeOnProject,
  assertValidTaskForTimeEntry,
  computeDurationSeconds,
  isTimeEntryRunning,
} from "@/modules/time-tracking/rules";
import type {
  CreateTimeEntryInput,
  StartTimerInput,
  TimeEntryListFilter,
  UpdateTimeEntryInput,
} from "@/modules/time-tracking/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
};

const timeEntryInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      client: { select: { company: { select: { name: true } } } },
    },
  },
  task: {
    select: { id: true, title: true, projectId: true },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.TimeEntryInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function parseDateTime(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${label}`);
  }
  return date;
}

function parseOptionalRate(value: string | undefined) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ValidationError("Hourly rate must be a non-negative number");
  }
  return parsed;
}

function canViewAllTimeEntries(actor: TenantActor) {
  return (
    hasPermission(actor.permissions ?? [], "TIME_ENTRY_DELETE") ||
    hasPermission(actor.permissions ?? [], "REPORT_VIEW")
  );
}

function canManageTimeEntry(actor: TenantActor, entry: { userId: string }) {
  if (canViewAllTimeEntries(actor)) {
    return true;
  }
  return entry.userId === actor.userId;
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

async function getTenantTask(actor: TenantActor, taskId: string | undefined) {
  if (!taskId) {
    return null;
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId: actor.organizationId,
    },
    select: { id: true, title: true, projectId: true },
  });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  return task;
}

async function resolveHourlyRate(
  organizationId: string,
  userId: string,
  providedRate: string | undefined,
) {
  if (providedRate) {
    return parseOptionalRate(providedRate);
  }

  const resource = await prisma.resource.findFirst({
    where: { organizationId, userId },
    select: { hourlyRate: true },
  });

  return resource?.hourlyRate ?? null;
}

async function assertNoActiveTimer(userId: string, organizationId: string, excludeId?: string) {
  const active = await prisma.timeEntry.findFirst({
    where: {
      organizationId,
      userId,
      endedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (active) {
    throw new ConflictError("Stop the running timer before starting another");
  }
}

async function resolveEntryUserId(actor: TenantActor, requestedUserId: string | undefined) {
  const userId = emptyToNull(requestedUserId) ?? actor.userId;
  if (userId !== actor.userId && !canViewAllTimeEntries(actor)) {
    throw new AuthorizationError("You can only log time for yourself");
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new ValidationError("User must belong to this organization");
  }

  return userId;
}

export function serializeTimeEntry(
  entry: Prisma.TimeEntryGetPayload<{ include: typeof timeEntryInclude }>,
) {
  return {
    id: entry.id,
    projectId: entry.projectId,
    project: {
      id: entry.project.id,
      name: entry.project.name,
      status: entry.project.status,
      clientName: entry.project.client.company.name,
    },
    taskId: entry.taskId,
    task: entry.task,
    userId: entry.userId,
    user: entry.user,
    startedAt: entry.startedAt,
    endedAt: entry.endedAt,
    durationSeconds: entry.durationSeconds,
    hourlyRate: moneyString(entry.hourlyRate),
    billable: entry.billable,
    notes: entry.notes,
    running: isTimeEntryRunning(entry),
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export type SerializedTimeEntry = ReturnType<typeof serializeTimeEntry>;

function listWhere(actor: TenantActor, filter: TimeEntryListFilter): Prisma.TimeEntryWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.TimeEntryWhereInput[] = [];
  const mineOnly = !canViewAllTimeEntries(actor);

  if (search) {
    and.push({
      OR: [
        { notes: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { task: { title: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
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
    project: {
      archivedAt: null,
      ...(filter.projectId ? { id: filter.projectId } : {}),
    },
    ...(filter.taskId ? { taskId: filter.taskId } : {}),
    ...(filter.userId ? { userId: filter.userId } : {}),
    ...(filter.billable !== undefined ? { billable: filter.billable } : {}),
    ...(filter.runningOnly ? { endedAt: null } : {}),
    ...(mineOnly ? { userId: actor.userId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listTimeEntries(actor: TenantActor, filter: TimeEntryListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor, filter);

  const rows = await prisma.timeEntry.findMany({
    where,
    include: timeEntryInclude,
    orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeTimeEntry),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.timeEntry.count({
      where: listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getTimeEntry(actor: TenantActor, id: string) {
  const entry = await prisma.timeEntry.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: timeEntryInclude,
  });

  if (!entry) {
    throw new NotFoundError("Time entry not found");
  }

  if (!canManageTimeEntry(actor, entry)) {
    throw new AuthorizationError("You can only view your own time entries");
  }

  return serializeTimeEntry(entry);
}

export async function getActiveTimeEntry(actor: TenantActor) {
  const entry = await prisma.timeEntry.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      endedAt: null,
    },
    include: timeEntryInclude,
    orderBy: { startedAt: "desc" },
  });

  return entry ? serializeTimeEntry(entry) : null;
}

export async function listTimeEntryProjectOptions(actor: TenantActor) {
  return prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
      status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] },
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

export async function listTimeEntryTaskOptions(actor: TenantActor, projectId?: string) {
  return prisma.task.findMany({
    where: {
      organizationId: actor.organizationId,
      project: {
        archivedAt: null,
        ...(projectId ? { id: projectId } : {}),
      },
    },
    select: { id: true, title: true, projectId: true },
    orderBy: [{ dueDate: "asc" }, { title: "asc" }],
    take: 100,
  });
}

export async function listTimeEntryUserOptions(actor: TenantActor) {
  if (!canViewAllTimeEntries(actor)) {
    return [];
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: actor.organizationId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return members.map((member) => member.user);
}

export async function createTimeEntry(actor: TenantActor, input: CreateTimeEntryInput) {
  const project = await getTenantProject(actor, input.projectId);
  assertCanLogTimeOnProject(project);

  const taskId = emptyToNull(input.taskId);
  const task = await getTenantTask(actor, taskId ?? undefined);
  assertValidTaskForTimeEntry(task, project.id);

  const userId = await resolveEntryUserId(actor, input.userId);
  const startedAt = parseDateTime(input.startedAt, "start time");
  const endedAt = input.endedAt ? parseDateTime(input.endedAt, "end time") : null;
  const durationSeconds =
    endedAt != null ? computeDurationSeconds(startedAt, endedAt) : null;

  if (endedAt == null) {
    await assertNoActiveTimer(userId, actor.organizationId);
  }

  const hourlyRate = await resolveHourlyRate(
    actor.organizationId,
    userId,
    input.hourlyRate,
  );

  const entry = await prisma.$transaction(async (tx) => {
    const created = await tx.timeEntry.create({
      data: {
        organizationId: actor.organizationId,
        projectId: project.id,
        taskId,
        userId,
        startedAt,
        endedAt,
        durationSeconds,
        hourlyRate,
        billable: input.billable ?? true,
        notes: emptyToNull(input.notes),
      },
      include: timeEntryInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: endedAt ? "Logged time entry" : "Started time timer",
        entityType: "TimeEntry",
        entityId: created.id,
        newValue: {
          projectId: created.projectId,
          userId: created.userId,
          durationSeconds: created.durationSeconds,
          billable: created.billable,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Time entry created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: entry.id,
    operation: "timeEntry.create",
  });

  return serializeTimeEntry(entry);
}

export async function startTimer(actor: TenantActor, input: StartTimerInput) {
  return createTimeEntry(actor, {
    projectId: input.projectId,
    taskId: input.taskId,
    startedAt: new Date().toISOString(),
    hourlyRate: undefined,
    billable: input.billable,
    notes: input.notes,
  });
}

export async function stopTimeEntry(actor: TenantActor, id: string) {
  const existing = await prisma.timeEntry.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: timeEntryInclude,
  });
  if (!existing) {
    throw new NotFoundError("Time entry not found");
  }
  if (!canManageTimeEntry(actor, existing)) {
    throw new AuthorizationError("You can only stop your own timers");
  }
  if (!isTimeEntryRunning(existing)) {
    throw new BusinessRuleError("This timer is already stopped");
  }

  const endedAt = new Date();
  const durationSeconds = computeDurationSeconds(existing.startedAt, endedAt);

  const entry = await prisma.$transaction(async (tx) => {
    const updated = await tx.timeEntry.update({
      where: { id: existing.id },
      data: { endedAt, durationSeconds },
      include: timeEntryInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Stopped time timer",
        entityType: "TimeEntry",
        entityId: updated.id,
        newValue: { durationSeconds: updated.durationSeconds },
      },
      tx,
    );

    return updated;
  });

  return serializeTimeEntry(entry);
}

export async function updateTimeEntry(
  actor: TenantActor,
  id: string,
  input: UpdateTimeEntryInput,
) {
  const existing = await prisma.timeEntry.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: timeEntryInclude,
  });
  if (!existing) {
    throw new NotFoundError("Time entry not found");
  }
  if (!canManageTimeEntry(actor, existing)) {
    throw new AuthorizationError("You can only update your own time entries");
  }

  const nextProjectId = input.projectId ?? existing.projectId;
  const project = await getTenantProject(actor, nextProjectId);
  assertCanLogTimeOnProject(project);

  const nextTaskId =
    input.taskId !== undefined ? emptyToNull(input.taskId) : existing.taskId;
  const task = nextTaskId ? await getTenantTask(actor, nextTaskId) : null;
  assertValidTaskForTimeEntry(task, nextProjectId);

  const startedAt =
    input.startedAt !== undefined
      ? parseDateTime(input.startedAt, "start time")
      : existing.startedAt;
  const endedAt =
    input.endedAt !== undefined
      ? input.endedAt
        ? parseDateTime(input.endedAt, "end time")
        : null
      : existing.endedAt;

  if (endedAt == null && !isTimeEntryRunning(existing)) {
    throw new BusinessRuleError("Completed entries must have an end time");
  }

  if (endedAt == null) {
    await assertNoActiveTimer(existing.userId, actor.organizationId, existing.id);
  }

  const durationSeconds =
    endedAt != null ? computeDurationSeconds(startedAt, endedAt) : null;

  const entry = await prisma.$transaction(async (tx) => {
    const updated = await tx.timeEntry.update({
      where: { id: existing.id },
      data: {
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.taskId !== undefined ? { taskId: nextTaskId } : {}),
        ...(input.startedAt !== undefined ? { startedAt } : {}),
        ...(input.endedAt !== undefined || input.startedAt !== undefined
          ? { endedAt, durationSeconds }
          : {}),
        ...(input.hourlyRate !== undefined
          ? { hourlyRate: parseOptionalRate(input.hourlyRate) }
          : {}),
        ...(input.billable !== undefined ? { billable: input.billable } : {}),
        ...(input.notes !== undefined ? { notes: emptyToNull(input.notes) } : {}),
      },
      include: timeEntryInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated time entry",
        entityType: "TimeEntry",
        entityId: updated.id,
        oldValue: { durationSeconds: existing.durationSeconds },
        newValue: { durationSeconds: updated.durationSeconds },
      },
      tx,
    );

    return updated;
  });

  return serializeTimeEntry(entry);
}

export async function deleteTimeEntry(actor: TenantActor, id: string) {
  const existing = await prisma.timeEntry.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: timeEntryInclude,
  });
  if (!existing) {
    throw new NotFoundError("Time entry not found");
  }
  if (!canManageTimeEntry(actor, existing)) {
    throw new AuthorizationError("You can only delete your own time entries");
  }

  await prisma.$transaction(async (tx) => {
    await tx.timeEntry.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted time entry",
        entityType: "TimeEntry",
        entityId: existing.id,
        oldValue: {
          projectId: existing.projectId,
          userId: existing.userId,
          durationSeconds: existing.durationSeconds,
        },
      },
      tx,
    );
  });

  return serializeTimeEntry(existing);
}

export async function getTimeEntrySummary(actor: TenantActor, projectId?: string) {
  const where = listWhere(actor, {
    projectId,
    first: 100,
    billable: undefined,
    runningOnly: false,
  });
  const entries = await prisma.timeEntry.findMany({
    where,
    select: {
      durationSeconds: true,
      billable: true,
      endedAt: true,
      hourlyRate: true,
    },
  });

  const completed = entries.filter((entry) => entry.endedAt != null);
  const totalSeconds = completed.reduce(
    (sum, entry) => sum + (entry.durationSeconds ?? 0),
    0,
  );
  const billableSeconds = completed
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + (entry.durationSeconds ?? 0), 0);

  return {
    totalEntries: entries.length,
    runningCount: entries.filter((entry) => entry.endedAt == null).length,
    totalSeconds,
    billableSeconds,
    nonBillableSeconds: totalSeconds - billableSeconds,
  };
}
