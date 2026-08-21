import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  activityHref,
  PROJECT_ACTIVITY_ENTITY_TYPES,
  summarizeActivityChange,
} from "@/modules/activity/rules";
import type { ActivityListFilter } from "@/modules/activity/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const activityInclude = {
  user: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.AuditLogInclude;

export function serializeActivity(
  row: Prisma.AuditLogGetPayload<{ include: typeof activityInclude }>,
) {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    href: activityHref(row.entityType, row.entityId),
    summary: summarizeActivityChange(row.oldValue, row.newValue),
    user: row.user,
    createdAt: row.createdAt,
  };
}

export type SerializedActivity = ReturnType<typeof serializeActivity>;

type EntityRef = { entityType: string; entityIds: string[] };

async function collectProjectEntityRefs(
  organizationId: string,
  projectId: string,
): Promise<EntityRef[]> {
  const [
    milestones,
    tasks,
    requirements,
    members,
    bidRequests,
    contracts,
    expenses,
    invoices,
    timeEntries,
  ] = await Promise.all([
    prisma.milestone.findMany({
      where: { projectId },
      select: { id: true },
    }),
    prisma.task.findMany({
      where: { projectId, organizationId },
      select: { id: true },
    }),
    prisma.projectRequirement.findMany({
      where: { projectId },
      select: { id: true },
    }),
    prisma.projectMember.findMany({
      where: { projectId, organizationId },
      select: { id: true },
    }),
    prisma.bidRequest.findMany({
      where: { projectId, organizationId },
      select: { id: true },
    }),
    prisma.contract.findMany({
      where: { projectId, organizationId },
      select: { id: true },
    }),
    prisma.expense.findMany({
      where: { projectId, organizationId },
      select: { id: true },
    }),
    prisma.invoice.findMany({
      where: { projectId, organizationId },
      select: { id: true },
    }),
    prisma.timeEntry.findMany({
      where: { projectId, organizationId },
      select: { id: true },
    }),
  ]);

  const bidRequestIds = bidRequests.map((row) => row.id);
  const requirementIds = requirements.map((row) => row.id);
  const expenseIds = expenses.map((row) => row.id);
  const invoiceIds = invoices.map((row) => row.id);

  const [bids, files, payments] = await Promise.all([
    bidRequestIds.length
      ? prisma.bid.findMany({
          where: { bidRequestId: { in: bidRequestIds }, organizationId },
          select: { id: true },
        })
      : Promise.resolve([] as Array<{ id: string }>),
    prisma.file.findMany({
      where: {
        organizationId,
        OR: [
          { entityType: "Project", entityId: projectId },
          ...(requirementIds.length
            ? [
                {
                  entityType: "ProjectRequirement",
                  entityId: { in: requirementIds },
                },
              ]
            : []),
          ...(expenseIds.length
            ? [{ entityType: "Expense", entityId: { in: expenseIds } }]
            : []),
        ],
      },
      select: { id: true },
    }),
    invoiceIds.length
      ? prisma.payment.findMany({
          where: { invoiceId: { in: invoiceIds }, organizationId },
          select: { id: true },
        })
      : Promise.resolve([] as Array<{ id: string }>),
  ]);

  return [
    { entityType: "Project", entityIds: [projectId] },
    { entityType: "Milestone", entityIds: milestones.map((row) => row.id) },
    { entityType: "Task", entityIds: tasks.map((row) => row.id) },
    {
      entityType: "ProjectRequirement",
      entityIds: requirementIds,
    },
    { entityType: "ProjectMember", entityIds: members.map((row) => row.id) },
    { entityType: "BidRequest", entityIds: bidRequestIds },
    { entityType: "Bid", entityIds: bids.map((row) => row.id) },
    { entityType: "Contract", entityIds: contracts.map((row) => row.id) },
    { entityType: "Expense", entityIds: expenseIds },
    { entityType: "Invoice", entityIds: invoiceIds },
    { entityType: "Payment", entityIds: payments.map((row) => row.id) },
    { entityType: "TimeEntry", entityIds: timeEntries.map((row) => row.id) },
    { entityType: "File", entityIds: files.map((row) => row.id) },
  ].filter((ref) => ref.entityIds.length > 0);
}

async function assertTenantProject(actor: TenantActor, projectId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId: actor.organizationId,
    },
    select: {
      id: true,
      name: true,
      status: true,
      client: { select: { company: { select: { name: true } } } },
    },
  });
  if (!project) {
    throw new NotFoundError("Project not found");
  }
  return project;
}

async function listWhere(
  actor: TenantActor,
  filter: ActivityListFilter,
): Promise<Prisma.AuditLogWhereInput> {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.AuditLogWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { action: { contains: search, mode: "insensitive" } },
        { entityType: { contains: search, mode: "insensitive" } },
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

  if (filter.projectId) {
    await assertTenantProject(actor, filter.projectId);
    const refs = await collectProjectEntityRefs(
      actor.organizationId,
      filter.projectId,
    );
    const scoped = filter.entityType
      ? refs.filter((ref) => ref.entityType === filter.entityType)
      : refs;

    if (scoped.length === 0) {
      return { id: "__none__" };
    }

    and.push({
      OR: scoped.map((ref) => ({
        entityType: ref.entityType,
        entityId: { in: ref.entityIds },
      })),
    });
  } else if (filter.entityType) {
    and.push({ entityType: filter.entityType });
  } else {
    and.push({
      entityType: { in: [...PROJECT_ACTIVITY_ENTITY_TYPES] },
    });
  }

  return {
    organizationId: actor.organizationId,
    ...(and.length ? { AND: and } : {}),
  };
}

export async function listActivity(actor: TenantActor, filter: ActivityListFilter) {
  const first = filter.first ?? 20;
  const where = await listWhere(actor, filter);

  const rows = await prisma.auditLog.findMany({
    where,
    include: activityInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeActivity),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.auditLog.count({
      where: await listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function listActivityProjectOptions(actor: TenantActor) {
  return prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      status: true,
      client: { select: { company: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function getProjectActivityPreview(
  actor: TenantActor,
  projectId: string,
  take = 8,
) {
  await assertTenantProject(actor, projectId);
  const result = await listActivity(actor, {
    projectId,
    first: take,
  });
  return result.nodes;
}
