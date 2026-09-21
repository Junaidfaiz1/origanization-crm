import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

type AuditInput = {
  organizationId: string;
  /** Null for system jobs (cron). */
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAuditLog(
  data: AuditInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await client.auditLog.create({
    data: {
      organizationId: data.organizationId,
      userId: data.userId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      metadata: data.metadata,
    },
  });
}
