import { prisma } from "@/lib/prisma/client";
import { ConflictError, AuthenticationError } from "@/lib/errors/app-error";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slug";
import { logger } from "@/lib/logging/logger";
import type { LoginInput, RegisterInput } from "@/modules/auth/validation";
import { SYSTEM_ROLES } from "@/config/permissions";

async function uniqueOrganizationSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let attempt = 0;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt + 1}`;
  }

  return slug;
}

export async function registerOrganization(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (existing) {
    throw new ConflictError("An account with this email already exists");
  }

  const ownerRole = await prisma.role.findFirst({
    where: { key: "OWNER", isSystem: true, organizationId: null },
  });
  if (!ownerRole) {
    throw new Error("System roles are not seeded. Run prisma db seed.");
  }

  const passwordHash = await hashPassword(input.password);
  const slug = await uniqueOrganizationSlug(input.organizationName);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        status: "ACTIVE",
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
        email: input.email.toLowerCase(),
      },
    });

    const membership = await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        roleId: ownerRole.id,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        action: "Created organization",
        entityType: "Organization",
        entityId: organization.id,
        newValue: { name: organization.name, slug: organization.slug },
      },
    });

    return { user, organization, membership };
  });

  const token = await signSession({
    sub: result.user.id,
    org: result.organization.id,
    membershipId: result.membership.id,
    roleKey: "OWNER",
  });

  logger.info("Organization registered", {
    userId: result.user.id,
    organizationId: result.organization.id,
    operation: "auth.register",
  });

  return { ...result, token };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { role: true, organization: true },
        orderBy: { joinedAt: "asc" },
        take: 1,
      },
    },
  });

  if (!user?.passwordHash || user.status !== "ACTIVE") {
    throw new AuthenticationError("Invalid email or password");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthenticationError("Invalid email or password");
  }

  const membership = user.memberships[0];
  if (!membership) {
    throw new AuthenticationError("No active organization membership");
  }

  const roleKey =
    membership.role.key && SYSTEM_ROLES.includes(membership.role.key as never)
      ? membership.role.key
      : membership.role.name;

  const token = await signSession({
    sub: user.id,
    org: membership.organizationId,
    membershipId: membership.id,
    roleKey,
  });

  logger.info("User logged in", {
    userId: user.id,
    organizationId: membership.organizationId,
    operation: "auth.login",
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    organization: membership.organization,
    roleKey,
  };
}

export async function getAuthenticatedUser(userId: string, organizationId: string) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      status: "ACTIVE",
    },
    include: {
      user: true,
      organization: true,
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!membership || membership.user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: membership.user.id,
    name: membership.user.name,
    email: membership.user.email,
    avatar: membership.user.avatar,
    roleKey: membership.role.key ?? membership.role.name,
    roleName: membership.role.name,
    permissions: membership.role.permissions.map((item) => item.permission.key),
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      currency: membership.organization.currency,
    },
  };
}
