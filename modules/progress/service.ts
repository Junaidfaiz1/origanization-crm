import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import { hasPermission } from "@/config/permissions";
import { computeProjectProgress } from "@/modules/progress/rules";
export { toPublicProgress } from "@/modules/progress/rules";
import type { ProgressListFilter } from "@/modules/progress/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
  roleKey?: string;
};

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export type SerializedProjectProgress = {
  projectId: string;
  name: string;
  clientId: string;
  clientName: string;
  status: string;
  health: string;
  overallPercent: number;
  milestonePercent: number | null;
  taskPercent: number | null;
  hoursPercent: number | null;
  budgetPercent: number | null;
  scheduleExpectedPercent: number | null;
  delayed: boolean;
  startDate: string | null;
  endDate: string | null;
  milestones: { total: number; completed: number };
  tasks: { total: number; done: number };
  hours: { estimated: number; logged: number } | null;
  budget: { planned: string; actual: string } | null;
  milestonesDetail?: Array<{
    id: string;
    name: string;
    status: string;
    dueDate: string | null;
    order: number;
    completed: boolean;
  }>;
};

function canViewHours(actor: TenantActor) {
  return hasPermission(actor.permissions ?? [], "TIME_ENTRY_VIEW");
}

function canViewBudget(actor: TenantActor) {
  return hasPermission(actor.permissions ?? [], "REPORT_VIEW");
}

function redact(
  row: SerializedProjectProgress,
  actor: TenantActor,
): SerializedProjectProgress {
  return {
    ...row,
    hours: canViewHours(actor) ? row.hours : null,
    hoursPercent: canViewHours(actor) ? row.hoursPercent : null,
    budget: canViewBudget(actor) ? row.budget : null,
    budgetPercent: canViewBudget(actor) ? row.budgetPercent : null,
  };
}

type CountMaps = {
  milestones: Map<string, { total: number; completed: number }>;
  tasks: Map<string, { total: number; done: number; estimatedHours: number }>;
  hours: Map<string, number>;
};

async function loadCountMaps(
  organizationId: string,
  projectIds: string[],
): Promise<CountMaps> {
  if (projectIds.length === 0) {
    return {
      milestones: new Map(),
      tasks: new Map(),
      hours: new Map(),
    };
  }

  const [milestoneGroups, taskRows, timeGroups] = await Promise.all([
    prisma.milestone.groupBy({
      by: ["projectId", "status"],
      where: { project: { organizationId, id: { in: projectIds } } },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: { organizationId, projectId: { in: projectIds } },
      select: { projectId: true, status: true, estimatedHours: true },
    }),
    prisma.timeEntry.groupBy({
      by: ["projectId"],
      where: {
        organizationId,
        projectId: { in: projectIds },
        durationSeconds: { not: null },
      },
      _sum: { durationSeconds: true },
    }),
  ]);

  const milestones = new Map<string, { total: number; completed: number }>();
  for (const row of milestoneGroups) {
    const current = milestones.get(row.projectId) ?? { total: 0, completed: 0 };
    current.total += row._count._all;
    if (row.status === "COMPLETED") {
      current.completed += row._count._all;
    }
    milestones.set(row.projectId, current);
  }

  const tasks = new Map<
    string,
    { total: number; done: number; estimatedHours: number }
  >();
  for (const row of taskRows) {
    const current = tasks.get(row.projectId) ?? {
      total: 0,
      done: 0,
      estimatedHours: 0,
    };
    current.total += 1;
    if (row.status === "DONE") {
      current.done += 1;
    }
    current.estimatedHours += toNumber(row.estimatedHours);
    tasks.set(row.projectId, current);
  }

  const hours = new Map<string, number>();
  for (const row of timeGroups) {
    hours.set(row.projectId, (row._sum.durationSeconds ?? 0) / 3600);
  }

  return { milestones, tasks, hours };
}

function serializeFromProject(
  project: {
    id: string;
    name: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    budget: { toString(): string } | null;
    actualCost: { toString(): string } | null;
    clientId: string;
    client: { company: { name: string } };
  },
  maps: CountMaps,
): SerializedProjectProgress {
  const milestone = maps.milestones.get(project.id) ?? {
    total: 0,
    completed: 0,
  };
  const task = maps.tasks.get(project.id) ?? {
    total: 0,
    done: 0,
    estimatedHours: 0,
  };
  const loggedHours = maps.hours.get(project.id) ?? 0;
  const budget = project.budget ? toNumber(project.budget) : null;
  const actualCost = project.actualCost ? toNumber(project.actualCost) : null;

  const computed = computeProjectProgress({
    status: project.status,
    startDate: project.startDate,
    endDate: project.endDate,
    milestoneTotal: milestone.total,
    milestoneCompleted: milestone.completed,
    taskTotal: task.total,
    taskDone: task.done,
    estimatedHours: task.estimatedHours,
    loggedHours,
    budget,
    actualCost,
  });

  return {
    projectId: project.id,
    name: project.name,
    clientId: project.clientId,
    clientName: project.client.company.name,
    status: project.status,
    health: computed.health,
    overallPercent: computed.overallPercent,
    milestonePercent: computed.milestonePercent,
    taskPercent: computed.taskPercent,
    hoursPercent: computed.hoursPercent,
    budgetPercent: computed.budgetPercent,
    scheduleExpectedPercent: computed.scheduleExpectedPercent,
    delayed: computed.delayed,
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    milestones: { total: milestone.total, completed: milestone.completed },
    tasks: { total: task.total, done: task.done },
    hours: {
      estimated: roundHours(task.estimatedHours),
      logged: roundHours(loggedHours),
    },
    budget: {
      planned: (budget ?? 0).toFixed(2),
      actual: (actualCost ?? 0).toFixed(2),
    },
  };
}

function roundHours(value: number) {
  return Math.round(value * 10) / 10;
}

const projectSelect = {
  id: true,
  name: true,
  status: true,
  startDate: true,
  endDate: true,
  budget: true,
  actualCost: true,
  clientId: true,
  createdAt: true,
  client: {
    select: { company: { select: { name: true } } },
  },
} satisfies Prisma.ProjectSelect;

export async function listProjectProgress(
  actor: TenantActor,
  filter: ProgressListFilter = { first: 20, sort: "newest" },
) {
  const where: Prisma.ProjectWhereInput = {
    organizationId: actor.organizationId,
    archivedAt: null,
  };

  if (filter.status) {
    where.status = filter.status;
  }
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      {
        client: {
          company: { name: { contains: filter.search, mode: "insensitive" } },
        },
      },
    ];
  }

  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const newestFirst = isNewestFirst(filter.sort);
  if (decoded) {
    where.AND = [createdAtCursorWhere(decoded, newestFirst)];
  }

  const take = filter.health ? 50 : (filter.first ?? 20);
  const rows = await prisma.project.findMany({
    where,
    select: projectSelect,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: filter.health ? take : take + 1,
  });

  const page = filter.health ? rows : rows.slice(0, take);
  const maps = await loadCountMaps(
    actor.organizationId,
    page.map((row) => row.id),
  );

  let nodes = page.map((row) => redact(serializeFromProject(row, maps), actor));
  if (filter.health) {
    nodes = nodes.filter((row) => row.health === filter.health);
  }

  const sourceById = new Map(page.map((row) => [row.id, row]));

  return {
    edges: nodes.map((node) => {
      const source = sourceById.get(node.projectId)!;
      return {
        cursor: encodeCursor(source.createdAt, source.id),
        node,
      };
    }),
    pageInfo: {
      hasNextPage: filter.health ? false : rows.length > take,
      endCursor:
        nodes.length && sourceById.get(nodes[nodes.length - 1]!.projectId)
          ? encodeCursor(
              sourceById.get(nodes[nodes.length - 1]!.projectId)!.createdAt,
              nodes[nodes.length - 1]!.projectId,
            )
          : null,
    },
    totalCount: filter.health
      ? nodes.length
      : await prisma.project.count({
          where: {
            organizationId: actor.organizationId,
            archivedAt: null,
            ...(filter.status ? { status: filter.status } : {}),
            ...(filter.search
              ? {
                  OR: [
                    { name: { contains: filter.search, mode: "insensitive" } },
                    {
                      client: {
                        company: {
                          name: { contains: filter.search, mode: "insensitive" },
                        },
                      },
                    },
                  ],
                }
              : {}),
          },
        }),
  };
}

export async function getProgressOverview(actor: TenantActor) {
  const result = await listProjectProgress(actor, { first: 50, sort: "newest" });
  const nodes = result.edges.map((edge) => edge.node);
  const count = (health: string) =>
    nodes.filter((row) => row.health === health).length;
  const avg =
    nodes.length === 0
      ? 0
      : Math.round(
          (nodes.reduce((sum, row) => sum + row.overallPercent, 0) /
            nodes.length) *
            10,
        ) / 10;

  return {
    total: nodes.length,
    averagePercent: avg,
    onTrack: count("ON_TRACK"),
    atRisk: count("AT_RISK"),
    delayed: count("DELAYED"),
    completed: count("COMPLETED"),
    notStarted: count("NOT_STARTED"),
  };
}

export async function getProjectProgress(actor: TenantActor, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: {
      ...projectSelect,
      milestones: {
        select: {
          id: true,
          name: true,
          status: true,
          dueDate: true,
          order: true,
        },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const maps = await loadCountMaps(actor.organizationId, [project.id]);
  const serialized = redact(serializeFromProject(project, maps), actor);

  return {
    ...serialized,
    milestonesDetail: project.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      status: milestone.status,
      dueDate: milestone.dueDate?.toISOString() ?? null,
      order: milestone.order,
      completed: milestone.status === "COMPLETED",
    })),
  };
}
