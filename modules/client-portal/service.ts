import { prisma } from "@/lib/prisma/client";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import {
  assertClientPortalActor,
  assertOwnsClientRecord,
  CLIENT_VISIBLE_PROPOSAL_STATUSES,
} from "@/modules/client-portal/rules";
import {
  acceptProposal,
  rejectProposal,
} from "@/modules/proposals/service";

type PortalActor = {
  userId: string;
  organizationId: string;
  roleKey?: string;
  permissions?: string[];
};

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : "0";
}

export async function resolvePortalClientId(actor: PortalActor) {
  assertClientPortalActor(actor.roleKey);

  const contact = await prisma.contact.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId: actor.userId,
      archivedAt: null,
    },
    select: { id: true, companyId: true },
  });

  if (!contact) {
    return null;
  }

  const client = await prisma.client.findFirst({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
      OR: [{ primaryContactId: contact.id }, { companyId: contact.companyId }],
    },
    select: {
      id: true,
      status: true,
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return client;
}

export async function requirePortalClient(actor: PortalActor) {
  const client = await resolvePortalClientId(actor);
  assertOwnsClientRecord(client?.id ?? null);
  return client!;
}

export async function getPortalHome(actor: PortalActor) {
  const client = await requirePortalClient(actor);

  const [proposals, projects, invoices, outstanding] = await Promise.all([
    prisma.proposal.count({
      where: {
        organizationId: actor.organizationId,
        clientId: client.id,
        archivedAt: null,
        status: { in: [...CLIENT_VISIBLE_PROPOSAL_STATUSES] },
      },
    }),
    prisma.project.count({
      where: {
        organizationId: actor.organizationId,
        clientId: client.id,
        archivedAt: null,
      },
    }),
    prisma.invoice.count({
      where: {
        organizationId: actor.organizationId,
        clientId: client.id,
        status: { not: "DRAFT" },
      },
    }),
    prisma.invoice.count({
      where: {
        organizationId: actor.organizationId,
        clientId: client.id,
        status: { in: ["SENT", "PARTIALLY_PAID", "OVERDUE"] },
        amountDue: { gt: 0 },
      },
    }),
  ]);

  const actionableProposals = await prisma.proposal.findMany({
    where: {
      organizationId: actor.organizationId,
      clientId: client.id,
      archivedAt: null,
      status: { in: ["SENT", "VIEWED", "CHANGES_REQUESTED"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      total: true,
      currency: true,
      validUntil: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  const recentInvoices = await prisma.invoice.findMany({
    where: {
      organizationId: actor.organizationId,
      clientId: client.id,
      status: { not: "DRAFT" },
    },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      amountDue: true,
      currency: true,
      issueDate: true,
    },
    orderBy: { issueDate: "desc" },
    take: 5,
  });

  return {
    client: {
      id: client.id,
      companyName: client.company.name,
      status: client.status,
    },
    counts: {
      proposals,
      projects,
      invoices,
      outstandingInvoices: outstanding,
    },
    actionableProposals: actionableProposals.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      total: moneyString(row.total),
      currency: row.currency,
      validUntil: row.validUntil,
    })),
    recentInvoices: recentInvoices.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      status: row.status,
      total: moneyString(row.total),
      amountDue: moneyString(row.amountDue),
      currency: row.currency,
      issueDate: row.issueDate,
    })),
  };
}

export async function listPortalProposals(actor: PortalActor) {
  if (!hasPermission(actor.permissions ?? [], "PROPOSAL_VIEW")) {
    throw new AuthorizationError("Missing PROPOSAL_VIEW");
  }
  const client = await requirePortalClient(actor);

  const rows = await prisma.proposal.findMany({
    where: {
      organizationId: actor.organizationId,
      clientId: client.id,
      archivedAt: null,
      status: { in: [...CLIENT_VISIBLE_PROPOSAL_STATUSES] },
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      subtotal: true,
      discount: true,
      tax: true,
      total: true,
      currency: true,
      validUntil: true,
      sentAt: true,
      acceptedAt: true,
      rejectedAt: true,
      createdAt: true,
      updatedAt: true,
      opportunity: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
        },
        orderBy: { id: "asc" },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    opportunityName: row.opportunity.name,
    subtotal: moneyString(row.subtotal),
    discount: moneyString(row.discount),
    tax: moneyString(row.tax),
    total: moneyString(row.total),
    currency: row.currency,
    validUntil: row.validUntil,
    sentAt: row.sentAt,
    acceptedAt: row.acceptedAt,
    rejectedAt: row.rejectedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: row.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: moneyString(item.quantity),
      unitPrice: moneyString(item.unitPrice),
      total: moneyString(item.total),
    })),
  }));
}

export async function getPortalProposal(actor: PortalActor, id: string) {
  const list = await listPortalProposals(actor);
  const proposal = list.find((row) => row.id === id);
  if (!proposal) {
    throw new NotFoundError("Proposal not found");
  }
  return proposal;
}

export async function acceptPortalProposal(actor: PortalActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "PROPOSAL_ACCEPT")) {
    throw new AuthorizationError("Missing PROPOSAL_ACCEPT");
  }
  await getPortalProposal(actor, id);
  await acceptProposal(actor, id);
  return getPortalProposal(actor, id);
}

export async function rejectPortalProposal(actor: PortalActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "PROPOSAL_REJECT")) {
    throw new AuthorizationError("Missing PROPOSAL_REJECT");
  }
  await getPortalProposal(actor, id);
  await rejectProposal(actor, id);
  return getPortalProposal(actor, id);
}

export async function listPortalProjects(actor: PortalActor) {
  if (!hasPermission(actor.permissions ?? [], "PROJECT_VIEW")) {
    throw new AuthorizationError("Missing PROJECT_VIEW");
  }
  const client = await requirePortalClient(actor);

  const rows = await prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      clientId: client.id,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      budget: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { milestones: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    budget: row.budget ? moneyString(row.budget) : null,
    startDate: row.startDate,
    endDate: row.endDate,
    milestoneCount: row._count.milestones,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function getPortalProject(actor: PortalActor, id: string) {
  if (!hasPermission(actor.permissions ?? [], "PROJECT_VIEW")) {
    throw new AuthorizationError("Missing PROJECT_VIEW");
  }
  const client = await requirePortalClient(actor);

  const project = await prisma.project.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
      clientId: client.id,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      budget: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
      milestones: {
        select: {
          id: true,
          name: true,
          description: true,
          amount: true,
          dueDate: true,
          status: true,
          order: true,
        },
        orderBy: [{ order: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    budget: project.budget ? moneyString(project.budget) : null,
    startDate: project.startDate,
    endDate: project.endDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    milestones: project.milestones.map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      amount: milestone.amount ? moneyString(milestone.amount) : null,
      dueDate: milestone.dueDate,
      status: milestone.status,
      order: milestone.order,
    })),
  };
}

export async function listPortalInvoices(actor: PortalActor) {
  if (!hasPermission(actor.permissions ?? [], "INVOICE_VIEW")) {
    throw new AuthorizationError("Missing INVOICE_VIEW");
  }
  const client = await requirePortalClient(actor);

  const rows = await prisma.invoice.findMany({
    where: {
      organizationId: actor.organizationId,
      clientId: client.id,
      status: { not: "DRAFT" },
    },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      subtotal: true,
      discount: true,
      tax: true,
      total: true,
      amountPaid: true,
      amountDue: true,
      currency: true,
      issueDate: true,
      dueDate: true,
      notes: true,
      project: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPrice: true,
          total: true,
        },
        orderBy: { id: "asc" },
      },
      _count: { select: { payments: true } },
    },
    orderBy: [{ issueDate: "desc" }, { id: "desc" }],
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    status: row.status,
    projectId: row.project?.id ?? null,
    projectName: row.project?.name ?? null,
    subtotal: moneyString(row.subtotal),
    discount: moneyString(row.discount),
    tax: moneyString(row.tax),
    total: moneyString(row.total),
    amountPaid: moneyString(row.amountPaid),
    amountDue: moneyString(row.amountDue),
    currency: row.currency,
    issueDate: row.issueDate,
    dueDate: row.dueDate,
    notes: row.notes,
    paymentCount: row._count.payments,
    items: row.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: moneyString(item.quantity),
      unitPrice: moneyString(item.unitPrice),
      total: moneyString(item.total),
    })),
  }));
}

export async function getPortalInvoice(actor: PortalActor, id: string) {
  const invoices = await listPortalInvoices(actor);
  const invoice = invoices.find((row) => row.id === id);
  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }
  return invoice;
}

export async function listPortalPayments(actor: PortalActor) {
  if (!hasPermission(actor.permissions ?? [], "PAYMENT_VIEW")) {
    throw new AuthorizationError("Missing PAYMENT_VIEW");
  }
  const client = await requirePortalClient(actor);

  const rows = await prisma.payment.findMany({
    where: {
      organizationId: actor.organizationId,
      status: { in: ["SUCCEEDED", "REFUNDED"] },
      invoice: { clientId: client.id },
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      provider: true,
      providerPaymentId: true,
      paidAt: true,
      metadata: true,
      createdAt: true,
      invoice: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
        },
      },
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    take: 50,
  });

  return rows.map((row) => {
    const metadata =
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
    const method = typeof metadata.method === "string" ? metadata.method : null;

    return {
      id: row.id,
      amount: moneyString(row.amount),
      currency: row.currency,
      status: row.status,
      provider: row.provider,
      reference: row.providerPaymentId,
      method,
      paidAt: row.paidAt,
      createdAt: row.createdAt,
      invoiceId: row.invoice.id,
      invoiceNumber: row.invoice.invoiceNumber,
      invoiceStatus: row.invoice.status,
    };
  });
}

export async function getPortalPayment(actor: PortalActor, id: string) {
  const payments = await listPortalPayments(actor);
  const payment = payments.find((row) => row.id === id);
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }
  return payment;
}
