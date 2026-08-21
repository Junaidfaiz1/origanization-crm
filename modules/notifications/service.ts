import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import { notificationHref, type NotificationAudience } from "@/modules/notifications/rules";
import type { NotificationListFilter } from "@/modules/notifications/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
  roleKey?: string;
};

function audienceForActor(actor: TenantActor): NotificationAudience {
  if (actor.roleKey === "CLIENT") return "client";
  if (actor.roleKey === "FREELANCER") return "freelancer";
  return "dashboard";
}

export function serializeNotification(
  row: {
    id: string;
    organizationId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    entityType: string | null;
    entityId: string | null;
    readAt: Date | null;
    createdAt: Date;
  },
  audience: NotificationAudience = "dashboard",
) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    type: row.type,
    title: row.title,
    message: row.message,
    entityType: row.entityType,
    entityId: row.entityId,
    href: notificationHref(row.entityType, row.entityId, audience),
    readAt: row.readAt,
    unread: row.readAt == null,
    createdAt: row.createdAt,
  };
}

export type SerializedNotification = ReturnType<typeof serializeNotification>;

function listWhere(
  actor: TenantActor,
  filter: NotificationListFilter,
): Prisma.NotificationWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const and: Prisma.NotificationWhereInput[] = [];

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
    userId: actor.userId,
    ...(filter.unreadOnly ? { readAt: null } : {}),
    ...(filter.type ? { type: filter.type } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listNotifications(
  actor: TenantActor,
  filter: NotificationListFilter,
) {
  const first = filter.first ?? 20;
  const where = listWhere(actor, filter);

  const rows = await prisma.notification.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map((row) => serializeNotification(row, audienceForActor(actor))),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.notification.count({
      where: listWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getNotification(actor: TenantActor, id: string) {
  const row = await prisma.notification.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
      userId: actor.userId,
    },
  });
  if (!row) {
    throw new NotFoundError("Notification not found");
  }
  return serializeNotification(row, audienceForActor(actor));
}

export async function getUnreadNotificationCount(actor: TenantActor) {
  return prisma.notification.count({
    where: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      readAt: null,
    },
  });
}

export async function markNotificationRead(actor: TenantActor, id: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
      userId: actor.userId,
    },
  });
  if (!existing) {
    throw new NotFoundError("Notification not found");
  }

  if (existing.readAt) {
    return serializeNotification(existing, audienceForActor(actor));
  }

  const updated = await prisma.notification.update({
    where: { id: existing.id },
    data: { readAt: new Date() },
  });

  return serializeNotification(updated, audienceForActor(actor));
}

export async function markAllNotificationsRead(actor: TenantActor) {
  const result = await prisma.notification.updateMany({
    where: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { count: result.count };
}
