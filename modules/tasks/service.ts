import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { logger } from "@/lib/logging/logger";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import {
  assertCanCreateTask,
  assertCanManageTasksOnProject,
  assertValidMilestoneForTask,
  TASK_STATUSES,
} from "@/modules/tasks/rules";
import type {
  CreateTaskInput,
  TaskListFilter,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "@/modules/tasks/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
};

const taskInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      archivedAt: true,
      client: {
        select: {
          id: true,
          company: { select: { name: true } },
        },
      },
    },
  },
  milestone: {
    select: { id: true, name: true, projectId: true },
  },
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.TaskInclude;

function hoursString(value: { toString(): string } | null | undefined) {
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

function parseOptionalHours(value: string | undefined) {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ValidationError("Hours must be a non-negative number");
  }
  return parsed;
}

function canViewAllTasks(actor: TenantActor) {
  return (
    hasPermission(actor.permissions ?? [], "TASK_CREATE") ||
    hasPermission(actor.permissions ?? [], "TASK_DELETE")
  );
}

function canManageTask(actor: TenantActor, task: { assignedToId: string | null }) {
  if (canViewAllTasks(actor)) {
    return true;
  }
  return task.assignedToId === actor.userId;
}

async function assertAssigneeInOrg(organizationId: string, assignedToId: string | undefined) {
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

async function getTenantMilestone(actor: TenantActor, milestoneId: string | undefined) {
  if (!milestoneId) {
    return null;
  }

  const milestone = await prisma.milestone.findFirst({
    where: {
      id: milestoneId,
      project: { organizationId: actor.organizationId },
    },
    select: { id: true, name: true, projectId: true },
  });

  if (!milestone) {
    throw new NotFoundError("Milestone not found");
  }

  return milestone;
}

export function serializeTask(
  task: Prisma.TaskGetPayload<{ include: typeof taskInclude }>,
) {
  return {
    id: task.id,
    projectId: task.projectId,
    project: {
      id: task.project.id,
      name: task.project.name,
      status: task.project.status,
      clientName: task.project.client.company.name,
    },
    milestoneId: task.milestoneId,
    milestone: task.milestone,
    assignedToId: task.assignedToId,
    assignedTo: task.assignedTo,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    estimatedHours: hoursString(task.estimatedHours),
    actualHours: hoursString(task.actualHours),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export type SerializedTask = ReturnType<typeof serializeTask>;

function listWhere(actor: TenantActor, filter: TaskListFilter): Prisma.TaskWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.TaskWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { assignedTo: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  const mineOnly = filter.mineOnly || !canViewAllTasks(actor);

  return tenantWhere(actor.organizationId, {
    project: {
      archivedAt: null,
      ...(filter.projectId ? { id: filter.projectId } : {}),
    },
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.priority ? { priority: filter.priority } : {}),
    ...(filter.milestoneId ? { milestoneId: filter.milestoneId } : {}),
    ...(filter.assignedToId ? { assignedToId: filter.assignedToId } : {}),
    ...(mineOnly ? { assignedToId: actor.userId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listTasks(actor: TenantActor, filter: TaskListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeTask),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.task.count({
      where: listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function listTasksForKanban(actor: TenantActor, filter: TaskListFilter) {
  const where = listWhere(actor, { ...filter, status: undefined, cursor: undefined, first: 100 });
  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const serialized = tasks.map(serializeTask);

  return {
    columns: TASK_STATUSES.map((status) => ({
      status,
      tasks: serialized.filter((task) => task.status === status),
    })),
    totalCount: serialized.length,
  };
}

export async function getTask(actor: TenantActor, id: string) {
  const task = await prisma.task.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: taskInclude,
  });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  if (!canViewAllTasks(actor) && task.assignedToId !== actor.userId) {
    throw new AuthorizationError("You can only view tasks assigned to you");
  }

  return serializeTask(task);
}

export async function listTaskProjectOptions(actor: TenantActor) {
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

export async function listTaskMilestoneOptions(actor: TenantActor, projectId?: string) {
  return prisma.milestone.findMany({
    where: {
      project: {
        organizationId: actor.organizationId,
        archivedAt: null,
        ...(projectId ? { id: projectId } : {}),
      },
    },
    select: { id: true, name: true, projectId: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    take: 100,
  });
}

export async function createTask(actor: TenantActor, input: CreateTaskInput) {
  const project = await getTenantProject(actor, input.projectId);
  assertCanCreateTask(project);

  const milestoneId = emptyToNull(input.milestoneId);
  const milestone = await getTenantMilestone(actor, milestoneId ?? undefined);
  assertValidMilestoneForTask(milestone, project.id);

  const assignedToId = emptyToNull(input.assignedToId);
  await assertAssigneeInOrg(actor.organizationId, assignedToId ?? undefined);

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        organizationId: actor.organizationId,
        projectId: project.id,
        milestoneId,
        assignedToId,
        title: input.title,
        description: emptyToNull(input.description),
        priority: input.priority ?? "MEDIUM",
        status: input.status ?? "TODO",
        dueDate: parseOptionalDate(input.dueDate),
        estimatedHours: parseOptionalHours(input.estimatedHours),
        actualHours: parseOptionalHours(input.actualHours),
      },
      include: taskInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created task",
        entityType: "Task",
        entityId: created.id,
        newValue: {
          projectId: created.projectId,
          title: created.title,
          status: created.status,
          assignedToId: created.assignedToId,
        },
      },
      tx,
    );

    if (created.assignedToId) {
      await createNotifications(
        {
          organizationId: actor.organizationId,
          userIds: [created.assignedToId],
          excludeUserId: actor.userId,
          type: "TASK_ASSIGNED",
          title: "Task assigned to you",
          message: `“${created.title}” was assigned to you on ${project.name}.`,
          entityType: "Task",
          entityId: created.id,
        },
        tx,
      );
    }

    return created;
  });

  logger.info("Task created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: task.id,
    operation: "task.create",
  });

  return serializeTask(task);
}

export async function updateTask(actor: TenantActor, id: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: taskInclude,
  });
  if (!existing) {
    throw new NotFoundError("Task not found");
  }
  if (!canManageTask(actor, existing)) {
    throw new AuthorizationError("You can only update tasks assigned to you");
  }

  const nextProjectId = input.projectId ?? existing.projectId;
  const project = await getTenantProject(actor, nextProjectId);
  assertCanManageTasksOnProject(project);

  const nextMilestoneId =
    input.milestoneId !== undefined ? emptyToNull(input.milestoneId) : existing.milestoneId;
  const milestone = nextMilestoneId
    ? await getTenantMilestone(actor, nextMilestoneId)
    : null;
  assertValidMilestoneForTask(milestone, nextProjectId);

  const nextAssignedToId =
    input.assignedToId !== undefined ? emptyToNull(input.assignedToId) : existing.assignedToId;
  if (input.assignedToId !== undefined) {
    await assertAssigneeInOrg(actor.organizationId, nextAssignedToId ?? undefined);
  }

  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: existing.id },
      data: {
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.milestoneId !== undefined ? { milestoneId: nextMilestoneId } : {}),
        ...(input.assignedToId !== undefined ? { assignedToId: nextAssignedToId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.dueDate !== undefined ? { dueDate: parseOptionalDate(input.dueDate) } : {}),
        ...(input.estimatedHours !== undefined
          ? { estimatedHours: parseOptionalHours(input.estimatedHours) }
          : {}),
        ...(input.actualHours !== undefined
          ? { actualHours: parseOptionalHours(input.actualHours) }
          : {}),
      },
      include: taskInclude,
    });

    const statusChanged = input.status !== undefined && input.status !== existing.status;

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: statusChanged ? "Updated task status" : "Updated task",
        entityType: "Task",
        entityId: updated.id,
        oldValue: { status: existing.status, title: existing.title },
        newValue: { status: updated.status, title: updated.title },
      },
      tx,
    );

    const assigneeChanged =
      input.assignedToId !== undefined &&
      nextAssignedToId != null &&
      nextAssignedToId !== existing.assignedToId;
    if (assigneeChanged && nextAssignedToId) {
      await createNotifications(
        {
          organizationId: actor.organizationId,
          userIds: [nextAssignedToId],
          excludeUserId: actor.userId,
          type: "TASK_ASSIGNED",
          title: "Task assigned to you",
          message: `“${updated.title}” was assigned to you on ${updated.project.name}.`,
          entityType: "Task",
          entityId: updated.id,
        },
        tx,
      );
    }

    return updated;
  });

  return serializeTask(task);
}

export async function updateTaskStatus(
  actor: TenantActor,
  id: string,
  input: UpdateTaskStatusInput,
) {
  return updateTask(actor, id, { status: input.status });
}

export async function deleteTask(actor: TenantActor, id: string) {
  const existing = await prisma.task.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: taskInclude,
  });
  if (!existing) {
    throw new NotFoundError("Task not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id: existing.id } });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Deleted task",
        entityType: "Task",
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

  return serializeTask(existing);
}

export async function getTaskStatusSummary(actor: TenantActor, projectId?: string) {
  const where = listWhere(actor, {
    projectId,
    first: 100,
    mineOnly: false,
    sort: "newest",
  });

  const tasks = await prisma.task.findMany({
    where,
    select: { status: true, priority: true },
  });

  return {
    total: tasks.length,
    openCount: tasks.filter((row) => row.status !== "DONE").length,
    stages: TASK_STATUSES.map((status) => ({
      status,
      count: tasks.filter((row) => row.status === status).length,
    })),
    priorities: {
      URGENT: tasks.filter((row) => row.priority === "URGENT").length,
      HIGH: tasks.filter((row) => row.priority === "HIGH").length,
    },
  };
}
