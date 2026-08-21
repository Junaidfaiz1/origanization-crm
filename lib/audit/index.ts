import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

type AuditInput = {
  organizationId: string;
  userId: string;
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
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      oldValue: data.oldValue,
      newValue: data.newValue,
      metadata: data.metadata,
    },
  });
}
