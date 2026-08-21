import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { BusinessRuleError, NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import { assertCanArchiveCompany } from "@/modules/companies/rules";
import type {
  CompanyListFilter,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@/modules/companies/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const companyInclude = {
  _count: {
    select: {
      contacts: { where: { archivedAt: null } },
      clients: { where: { archivedAt: null } },
    },
  },
} satisfies Prisma.CompanyInclude;

export function serializeCompany(
  company: Prisma.CompanyGetPayload<{ include: typeof companyInclude }>,
) {
  return {
    id: company.id,
    name: company.name,
    website: company.website,
    industry: company.industry,
    address: company.address,
    city: company.city,
    country: company.country,
    contactCount: company._count.contacts,
    clientCount: company._count.clients,
    archivedAt: company.archivedAt,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export type SerializedCompany = ReturnType<typeof serializeCompany>;

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function listWhere(
  organizationId: string,
  filter: CompanyListFilter,
): Prisma.CompanyWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.CompanyWhereInput[] = [];

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
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

  return tenantWhere(organizationId, {
    archivedAt: null,
    ...(filter.industry
      ? { industry: { equals: filter.industry, mode: "insensitive" } }
      : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listCompanies(actor: TenantActor, filter: CompanyListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);

  const rows = await prisma.company.findMany({
    where,
    include: companyInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeCompany),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.company.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getCompany(actor: TenantActor, id: string) {
  const company = await prisma.company.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: companyInclude,
  });

  if (!company) {
    throw new NotFoundError("Company not found");
  }

  return serializeCompany(company);
}

export async function createCompany(actor: TenantActor, input: CreateCompanyInput) {
  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        organizationId: actor.organizationId,
        name: input.name,
        website: emptyToNull(input.website),
        industry: emptyToNull(input.industry),
        address: emptyToNull(input.address),
        city: emptyToNull(input.city),
        country: emptyToNull(input.country),
      },
      include: companyInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created company",
        entityType: "Company",
        entityId: created.id,
        newValue: { name: created.name, industry: created.industry },
      },
      tx,
    );

    return created;
  });

  logger.info("Company created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: company.id,
    operation: "company.create",
  });

  return serializeCompany(company);
}

export async function updateCompany(
  actor: TenantActor,
  id: string,
  input: UpdateCompanyInput,
) {
  const existing = await prisma.company.findFirst({
    where: { id, organizationId: actor.organizationId },
  });
  if (!existing) {
    throw new NotFoundError("Company not found");
  }
  if (existing.archivedAt) {
    throw new BusinessRuleError("Archived companies cannot be edited");
  }

  const company = await prisma.$transaction(async (tx) => {
    const updated = await tx.company.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.website !== undefined ? { website: emptyToNull(input.website) } : {}),
        ...(input.industry !== undefined ? { industry: emptyToNull(input.industry) } : {}),
        ...(input.address !== undefined ? { address: emptyToNull(input.address) } : {}),
        ...(input.city !== undefined ? { city: emptyToNull(input.city) } : {}),
        ...(input.country !== undefined ? { country: emptyToNull(input.country) } : {}),
      },
      include: companyInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated company",
        entityType: "Company",
        entityId: updated.id,
        oldValue: { name: existing.name, industry: existing.industry },
        newValue: { name: updated.name, industry: updated.industry },
      },
      tx,
    );

    return updated;
  });

  return serializeCompany(company);
}

export async function archiveCompany(actor: TenantActor, id: string) {
  const existing = await prisma.company.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: companyInclude,
  });
  if (!existing) {
    throw new NotFoundError("Company not found");
  }

  assertCanArchiveCompany(existing);

  const company = await prisma.$transaction(async (tx) => {
    const updated = await tx.company.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
      include: companyInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Archived company",
        entityType: "Company",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeCompany(company);
}
