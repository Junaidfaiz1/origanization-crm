import { prisma } from "@/lib/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import {
  createNotifications,
  findClientUserIds,
} from "@/lib/notifications";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logging/logger";
import {
  CRON_BATCH_SIZE,
  bidRequestExpiredWhere,
  invoiceOverdueWhere,
  invoiceReminderWhere,
  proposalExpiredWhere,
  reminderLookbackStart,
} from "@/modules/cron/rules";

export type CronJobResult = {
  processed: number;
  skipped?: number;
};

export async function expireBids(now = new Date()): Promise<CronJobResult> {
  const candidates = await prisma.bidRequest.findMany({
    where: bidRequestExpiredWhere(now),
    select: {
      id: true,
      organizationId: true,
      status: true,
      title: true,
    },
    take: CRON_BATCH_SIZE,
    orderBy: { updatedAt: "asc" },
  });

  let processed = 0;
  for (const row of candidates) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.bidRequest.updateMany({
        where: {
          id: row.id,
          organizationId: row.organizationId,
          ...bidRequestExpiredWhere(now),
        },
        data: { status: "CLOSED" },
      });
      if (updated.count === 0) {
        return;
      }

      await writeAuditLog(
        {
          organizationId: row.organizationId,
          userId: null,
          action: "Expired bid request (cron)",
          entityType: "BidRequest",
          entityId: row.id,
          oldValue: { status: row.status },
          newValue: { status: "CLOSED" },
          metadata: { source: "cron.expire-bids" },
        },
        tx,
      );
      processed += 1;
    });
  }

  logger.info("Cron expire-bids finished", {
    operation: "cron.expire-bids",
    processed,
    scanned: candidates.length,
  });

  return { processed };
}

export async function expireProposals(now = new Date()): Promise<CronJobResult> {
  const candidates = await prisma.proposal.findMany({
    where: proposalExpiredWhere(now),
    select: {
      id: true,
      organizationId: true,
      status: true,
      title: true,
    },
    take: CRON_BATCH_SIZE,
    orderBy: { updatedAt: "asc" },
  });

  let processed = 0;
  for (const row of candidates) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.updateMany({
        where: {
          id: row.id,
          organizationId: row.organizationId,
          ...proposalExpiredWhere(now),
        },
        data: { status: "EXPIRED" },
      });
      if (updated.count === 0) {
        return;
      }

      await writeAuditLog(
        {
          organizationId: row.organizationId,
          userId: null,
          action: "Expired proposal (cron)",
          entityType: "Proposal",
          entityId: row.id,
          oldValue: { status: row.status },
          newValue: { status: "EXPIRED" },
          metadata: { source: "cron.expire-proposals" },
        },
        tx,
      );
      processed += 1;
    });
  }

  logger.info("Cron expire-proposals finished", {
    operation: "cron.expire-proposals",
    processed,
    scanned: candidates.length,
  });

  return { processed };
}

export async function markOverdueInvoices(
  now = new Date(),
): Promise<CronJobResult> {
  const candidates = await prisma.invoice.findMany({
    where: invoiceOverdueWhere(now),
    select: {
      id: true,
      organizationId: true,
      status: true,
      invoiceNumber: true,
    },
    take: CRON_BATCH_SIZE,
    orderBy: { updatedAt: "asc" },
  });

  let processed = 0;
  for (const row of candidates) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.updateMany({
        where: {
          id: row.id,
          organizationId: row.organizationId,
          ...invoiceOverdueWhere(now),
        },
        data: { status: "OVERDUE" },
      });
      if (updated.count === 0) {
        return;
      }

      await writeAuditLog(
        {
          organizationId: row.organizationId,
          userId: null,
          action: "Marked invoice overdue (cron)",
          entityType: "Invoice",
          entityId: row.id,
          oldValue: { status: row.status },
          newValue: { status: "OVERDUE" },
          metadata: { source: "cron.mark-overdue-invoices" },
        },
        tx,
      );
      processed += 1;
    });
  }

  logger.info("Cron mark-overdue-invoices finished", {
    operation: "cron.mark-overdue-invoices",
    processed,
    scanned: candidates.length,
  });

  return { processed };
}

export async function sendReminders(now = new Date()): Promise<CronJobResult> {
  const lookback = reminderLookbackStart(now);
  const candidates = await prisma.invoice.findMany({
    where: invoiceReminderWhere(now),
    select: {
      id: true,
      organizationId: true,
      clientId: true,
      invoiceNumber: true,
      dueDate: true,
      amountDue: true,
    },
    take: CRON_BATCH_SIZE,
    orderBy: { dueDate: "asc" },
  });

  let processed = 0;
  let skipped = 0;

  for (const invoice of candidates) {
    const recent = await prisma.notification.findFirst({
      where: {
        organizationId: invoice.organizationId,
        type: "INVOICE_REMINDER",
        entityType: "Invoice",
        entityId: invoice.id,
        createdAt: { gte: lookback },
      },
      select: { id: true },
    });
    if (recent) {
      skipped += 1;
      continue;
    }

    const clientUserIds = await findClientUserIds(
      invoice.organizationId,
      invoice.clientId,
    );
    if (clientUserIds.length === 0) {
      skipped += 1;
      continue;
    }

    await createNotifications({
      organizationId: invoice.organizationId,
      userIds: clientUserIds,
      type: "INVOICE_REMINDER",
      title: "Invoice payment reminder",
      message: `Invoice ${invoice.invoiceNumber} is outstanding.`,
      entityType: "Invoice",
      entityId: invoice.id,
    });

    const users = await prisma.user.findMany({
      where: { id: { in: clientUserIds } },
      select: { email: true },
    });
    for (const user of users) {
      if (user.email) {
        await emailService.sendPaymentReminder(user.email, invoice.invoiceNumber);
      }
    }

    await writeAuditLog({
      organizationId: invoice.organizationId,
      userId: null,
      action: "Sent invoice reminder (cron)",
      entityType: "Invoice",
      entityId: invoice.id,
      newValue: {
        invoiceNumber: invoice.invoiceNumber,
        amountDue: invoice.amountDue.toString(),
      },
      metadata: { source: "cron.send-reminders" },
    });

    processed += 1;
  }

  logger.info("Cron send-reminders finished", {
    operation: "cron.send-reminders",
    processed,
    skipped,
    scanned: candidates.length,
  });

  return { processed, skipped };
}
