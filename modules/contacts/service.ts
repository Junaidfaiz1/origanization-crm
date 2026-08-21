import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import { BusinessRuleError, NotFoundError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import { assertCanArchiveContact } from "@/modules/contacts/rules";
import type {
  ContactListFilter,
  CreateContactInput,
  UpdateContactInput,
} from "@/modules/contacts/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
};

const contactInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      primaryFor: { where: { archivedAt: null } },
    },
  },
} satisfies Prisma.ContactInclude;

export function serializeContact(
  contact: Prisma.ContactGetPayload<{ include: typeof contactInclude }>,
) {
  return {
    id: contact.id,
    companyId: contact.companyId,
    company: contact.company,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    designation: contact.designation,
    primaryClientCount: contact._count.primaryFor,
    archivedAt: contact.archivedAt,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

export type SerializedContact = ReturnType<typeof serializeContact>;

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

async function assertActiveCompany(actor: TenantActor, companyId: string) {
  const company = await prisma.company.findFirst({
    where: { id: companyId, organizationId: actor.organizationId, archivedAt: null },
    select: { id: true },
  });

  if (!company) {
    throw new BusinessRuleError("Choose an active company in your organization");
  }

  return company;
}

function listWhere(
  organizationId: string,
  filter: ContactListFilter,
): Prisma.ContactWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.ContactWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return tenantWhere(organizationId, {
    archivedAt: null,
    ...(filter.companyId ? { companyId: filter.companyId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listContacts(actor: TenantActor, filter: ContactListFilter) {
  const first = filter.first ?? 20;
  const where = listWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.contact.findMany({
    where,
    include: contactInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeContact),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.contact.count({
      where: listWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getContact(actor: TenantActor, id: string) {
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: contactInclude,
  });

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  return serializeContact(contact);
}

export async function listContactCompanyOptions(actor: TenantActor) {
  return prisma.company.findMany({
    where: tenantWhere(actor.organizationId, { archivedAt: null }),
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function createContact(actor: TenantActor, input: CreateContactInput) {
  await assertActiveCompany(actor, input.companyId);

  const contact = await prisma.$transaction(async (tx) => {
    const created = await tx.contact.create({
      data: {
        organizationId: actor.organizationId,
        companyId: input.companyId,
        name: input.name,
        email: emptyToNull(input.email),
        phone: emptyToNull(input.phone),
        designation: emptyToNull(input.designation),
      },
      include: contactInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created contact",
        entityType: "Contact",
        entityId: created.id,
        newValue: {
          name: created.name,
          companyId: created.companyId,
          email: created.email,
        },
      },
      tx,
    );

    return created;
  });

  logger.info("Contact created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: contact.id,
    operation: "contact.create",
  });

  return serializeContact(contact);
}

export async function updateContact(
  actor: TenantActor,
  id: string,
  input: UpdateContactInput,
) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: contactInclude,
  });
  if (!existing) {
    throw new NotFoundError("Contact not found");
  }
  if (existing.archivedAt) {
    throw new BusinessRuleError("Archived contacts cannot be edited");
  }

  if (input.companyId && input.companyId !== existing.companyId) {
    await assertActiveCompany(actor, input.companyId);
  }

  const contact = await prisma.$transaction(async (tx) => {
    const updated = await tx.contact.update({
      where: { id: existing.id },
      data: {
        ...(input.companyId !== undefined ? { companyId: input.companyId } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: emptyToNull(input.email) } : {}),
        ...(input.phone !== undefined ? { phone: emptyToNull(input.phone) } : {}),
        ...(input.designation !== undefined
          ? { designation: emptyToNull(input.designation) }
          : {}),
      },
      include: contactInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated contact",
        entityType: "Contact",
        entityId: updated.id,
        oldValue: {
          name: existing.name,
          companyId: existing.companyId,
          email: existing.email,
        },
        newValue: {
          name: updated.name,
          companyId: updated.companyId,
          email: updated.email,
        },
      },
      tx,
    );

    return updated;
  });

  return serializeContact(contact);
}

export async function archiveContact(actor: TenantActor, id: string) {
  const existing = await prisma.contact.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: contactInclude,
  });
  if (!existing) {
    throw new NotFoundError("Contact not found");
  }

  assertCanArchiveContact(existing);

  const contact = await prisma.$transaction(async (tx) => {
    const updated = await tx.contact.update({
      where: { id: existing.id },
      data: { archivedAt: new Date() },
      include: contactInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Archived contact",
        entityType: "Contact",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeContact(contact);
}
