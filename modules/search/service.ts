import { prisma } from "@/lib/prisma/client";
import { hasPermission } from "@/config/permissions";

type SearchActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
};

export type SearchHit = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  href: string;
};

const PER_TYPE = 4;
const MAX_TOTAL = 20;

export async function searchWorkspace(
  actor: SearchActor,
  rawQuery: string,
): Promise<SearchHit[]> {
  const query = rawQuery.trim();
  if (query.length < 2) {
    return [];
  }

  const orgId = actor.organizationId;
  const perms = actor.permissions ?? [];
  const hits: SearchHit[] = [];

  const tasks: Array<Promise<void>> = [];

  if (hasPermission(perms, "LEAD_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.lead.findMany({
          where: {
            organizationId: orgId,
            archivedAt: null,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { companyName: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, companyName: true, status: true },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Lead",
            title: row.name,
            subtitle: [row.companyName, row.status].filter(Boolean).join(" · ") || null,
            href: `/leads/${row.id}`,
          });
        }
      })(),
    );
  }

  if (hasPermission(perms, "CLIENT_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.client.findMany({
          where: {
            organizationId: orgId,
            archivedAt: null,
            company: { name: { contains: query, mode: "insensitive" } },
          },
          select: {
            id: true,
            status: true,
            company: { select: { name: true } },
          },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Client",
            title: row.company.name,
            subtitle: row.status,
            href: `/clients/${row.id}`,
          });
        }
      })(),
    );
  }

  if (hasPermission(perms, "COMPANY_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.company.findMany({
          where: {
            organizationId: orgId,
            archivedAt: null,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { industry: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, industry: true },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Company",
            title: row.name,
            subtitle: row.industry,
            href: `/companies/${row.id}`,
          });
        }
      })(),
    );

    tasks.push(
      (async () => {
        const rows = await prisma.contact.findMany({
          where: {
            organizationId: orgId,
            archivedAt: null,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            company: { select: { name: true } },
          },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Contact",
            title: row.name,
            subtitle: [row.company.name, row.email].filter(Boolean).join(" · ") || null,
            href: `/contacts/${row.id}`,
          });
        }
      })(),
    );
  }

  if (hasPermission(perms, "OPPORTUNITY_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.opportunity.findMany({
          where: {
            organizationId: orgId,
            archivedAt: null,
            name: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            stage: true,
            client: { select: { company: { select: { name: true } } } },
          },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Opportunity",
            title: row.name,
            subtitle: [row.client.company.name, row.stage].join(" · "),
            href: `/opportunities/${row.id}`,
          });
        }
      })(),
    );
  }

  if (hasPermission(perms, "PROPOSAL_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.proposal.findMany({
          where: {
            organizationId: orgId,
            archivedAt: null,
            title: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            title: true,
            status: true,
            client: { select: { company: { select: { name: true } } } },
          },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Proposal",
            title: row.title,
            subtitle: [row.client.company.name, row.status].join(" · "),
            href: `/proposals/${row.id}`,
          });
        }
      })(),
    );
  }

  if (hasPermission(perms, "PROJECT_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.project.findMany({
          where: {
            organizationId: orgId,
            archivedAt: null,
            name: { contains: query, mode: "insensitive" },
          },
          select: {
            id: true,
            name: true,
            status: true,
            client: { select: { company: { select: { name: true } } } },
          },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Project",
            title: row.name,
            subtitle: [row.client.company.name, row.status].join(" · "),
            href: `/projects/${row.id}`,
          });
        }
      })(),
    );
  }

  if (hasPermission(perms, "BID_REQUEST_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.bidRequest.findMany({
          where: {
            organizationId: orgId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { project: { name: { contains: query, mode: "insensitive" } } },
            ],
          },
          select: {
            id: true,
            title: true,
            status: true,
            project: { select: { name: true } },
          },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Bid request",
            title: row.title,
            subtitle: [row.project.name, row.status].join(" · "),
            href: `/bidding/requests/${row.id}`,
          });
        }
      })(),
    );
  }

  if (hasPermission(perms, "INVOICE_VIEW")) {
    tasks.push(
      (async () => {
        const rows = await prisma.invoice.findMany({
          where: {
            organizationId: orgId,
            OR: [
              { invoiceNumber: { contains: query, mode: "insensitive" } },
              { client: { company: { name: { contains: query, mode: "insensitive" } } } },
            ],
          },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            client: { select: { company: { select: { name: true } } } },
          },
          take: PER_TYPE,
          orderBy: { updatedAt: "desc" },
        });
        for (const row of rows) {
          hits.push({
            id: row.id,
            type: "Invoice",
            title: row.invoiceNumber,
            subtitle: [row.client.company.name, row.status].join(" · "),
            href: `/invoices/${row.id}`,
          });
        }
      })(),
    );
  }

  await Promise.all(tasks);
  return hits.slice(0, MAX_TOTAL);
}
