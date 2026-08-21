import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import type { NotificationType } from "@/modules/notifications/types";

export type { NotificationType } from "@/modules/notifications/types";
export { NOTIFICATION_TYPES } from "@/modules/notifications/types";

export type CreateNotificationInput = {
  organizationId: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
};

export type CreateNotificationsInput = {
  organizationId: string;
  userIds: readonly (string | null | undefined)[];
  type: NotificationType | string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  /** Skip notifying this user (usually the actor). */
  excludeUserId?: string | null;
};

type DbClient = Prisma.TransactionClient | typeof prisma;

function uniqueUserIds(
  userIds: readonly (string | null | undefined)[],
  excludeUserId?: string | null,
) {
  const skip = excludeUserId ?? null;
  return [...new Set(userIds.filter((id): id is string => Boolean(id && id !== skip)))];
}

export async function createNotification(
  input: CreateNotificationInput,
  client: DbClient = prisma,
) {
  return client.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    },
  });
}

export async function createNotifications(
  input: CreateNotificationsInput,
  client: DbClient = prisma,
) {
  const userIds = uniqueUserIds(input.userIds, input.excludeUserId);
  if (userIds.length === 0) {
    return { count: 0 };
  }

  return client.notification.createMany({
    data: userIds.map((userId) => ({
      organizationId: input.organizationId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
    })),
  });
}

/** Resolve portal-linked user ids for a client (contact.userId). */
export async function findClientUserIds(
  organizationId: string,
  clientId: string,
  client: DbClient = prisma,
) {
  const record = await client.client.findFirst({
    where: { id: clientId, organizationId },
    select: {
      primaryContact: { select: { userId: true } },
      company: {
        select: {
          contacts: {
            where: { userId: { not: null }, archivedAt: null },
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!record) {
    return [] as string[];
  }

  return uniqueUserIds([
    record.primaryContact?.userId,
    ...record.company.contacts.map((row) => row.userId),
  ]);
}
