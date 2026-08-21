import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logging/logger";
import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import { emailService } from "@/lib/email/email-service";
import { getEnv } from "@/config/env";
import { createRawToken, hashToken, tokenExpiry } from "@/lib/auth/tokens";
import {
  assertAssignableRole,
  assertCanDemoteOwner,
  assertCanSuspendOwner,
} from "@/modules/users/rules";
import type {
  InviteUserInput,
  MemberListFilter,
  SuspendMemberInput,
  UpdateMemberRoleInput,
} from "@/modules/users/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  roleKey?: string;
};

const memberInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
  },
  role: {
    select: {
      id: true,
      key: true,
      name: true,
    },
  },
} satisfies Prisma.OrganizationMemberInclude;

export type SerializedOrgMember = {
  id: string;
  organizationId: string;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  };
  role: {
    id: string;
    key: string | null;
    name: string;
  };
};

function serializeMember(
  member: Prisma.OrganizationMemberGetPayload<{ include: typeof memberInclude }>,
): SerializedOrgMember {
  return {
    id: member.id,
    organizationId: member.organizationId,
    status: member.status,
    joinedAt: member.joinedAt.toISOString(),
    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      status: member.user.status,
      createdAt: member.user.createdAt.toISOString(),
    },
    role: {
      id: member.role.id,
      key: member.role.key,
      name: member.role.name,
    },
  };
}

async function getSystemRole(roleKey: string) {
  const role = await prisma.role.findFirst({
    where: { key: roleKey, isSystem: true, organizationId: null },
  });
  if (!role) {
    throw new BusinessRuleError(`System role ${roleKey} is not seeded`);
  }
  return role;
}

async function countActiveOwners(organizationId: string) {
  return prisma.organizationMember.count({
    where: {
      organizationId,
      status: "ACTIVE",
      role: { key: "OWNER" },
    },
  });
}

async function issueInviteToken(input: {
  userId: string;
  organizationId: string;
}) {
  const rawToken = createRawToken();
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: input.userId,
      organizationId: input.organizationId,
      purpose: "INVITE",
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: input.userId,
      organizationId: input.organizationId,
      tokenHash,
      purpose: "INVITE",
      expiresAt: tokenExpiry(24 * 7),
    },
  });

  return rawToken;
}

function appUrl(path: string) {
  try {
    return new URL(path, getEnv().NEXT_PUBLIC_APP_URL).toString();
  } catch {
    return path;
  }
}

export async function listOrgMembers(
  actor: TenantActor,
  filter: MemberListFilter = { first: 50 },
) {
  const where: Prisma.OrganizationMemberWhereInput = {
    organizationId: actor.organizationId,
  };

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.search) {
    where.user = {
      OR: [
        { name: { contains: filter.search, mode: "insensitive" } },
        { email: { contains: filter.search, mode: "insensitive" } },
      ],
    };
  }

  const take = filter.first ?? 50;
  const decoded = filter.after ? decodeCursor(filter.after) : null;

  const and: Prisma.OrganizationMemberWhereInput[] = [];
  if (decoded) {
    and.push({
      OR: [
        { joinedAt: { lt: decoded.createdAt } },
        {
          AND: [{ joinedAt: decoded.createdAt }, { id: { lt: decoded.id } }],
        },
      ],
    });
  }
  if (and.length) {
    where.AND = and;
  }

  const [rows, totalCount] = await Promise.all([
    prisma.organizationMember.findMany({
      where,
      include: memberInclude,
      orderBy: [{ joinedAt: "desc" }, { id: "desc" }],
      take: take + 1,
    }),
    prisma.organizationMember.count({
      where: {
        organizationId: actor.organizationId,
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.search
          ? {
              user: {
                OR: [
                  { name: { contains: filter.search, mode: "insensitive" } },
                  { email: { contains: filter.search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
    }),
  ]);

  const hasNextPage = rows.length > take;
  const page = hasNextPage ? rows.slice(0, take) : rows;

  return {
    edges: page.map((member) => ({
      cursor: encodeCursor(member.joinedAt, member.id),
      node: serializeMember(member),
    })),
    pageInfo: {
      hasNextPage,
      endCursor: page.length
        ? encodeCursor(page[page.length - 1]!.joinedAt, page[page.length - 1]!.id)
        : null,
    },
    totalCount,
  };
}

export async function getOrgMember(actor: TenantActor, membershipId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: {
      id: membershipId,
      organizationId: actor.organizationId,
    },
    include: memberInclude,
  });
  if (!member) {
    throw new NotFoundError("Member not found");
  }
  return serializeMember(member);
}

export async function listAssignableRoles() {
  const roles = await prisma.role.findMany({
    where: {
      isSystem: true,
      organizationId: null,
      key: { not: null },
    },
    orderBy: { name: "asc" },
    select: { id: true, key: true, name: true },
  });
  return roles.filter((role) => role.key !== null) as Array<{
    id: string;
    key: string;
    name: string;
  }>;
}

export async function inviteUser(actor: TenantActor, input: InviteUserInput) {
  assertAssignableRole(input.roleKey, actor.roleKey ?? "");

  const email = input.email.toLowerCase();
  const role = await getSystemRole(input.roleKey);

  const organization = await prisma.organization.findUnique({
    where: { id: actor.organizationId },
    select: { id: true, name: true },
  });
  if (!organization) {
    throw new NotFoundError("Organization not found");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: actor.organizationId,
          userId: existingUser.id,
        },
      },
    });
    if (existingMembership) {
      throw new ConflictError("This user is already a member of the organization");
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const user =
      existingUser ??
      (await tx.user.create({
        data: {
          name: input.name,
          email,
          status: "INVITED",
          passwordHash: null,
        },
      }));

    if (existingUser && existingUser.status === "DISABLED") {
      throw new BusinessRuleError("Cannot invite a disabled user account");
    }

    if (
      existingUser &&
      existingUser.status !== "ACTIVE" &&
      existingUser.status !== "INVITED"
    ) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: { status: "INVITED", name: input.name },
      });
    }

    const membership = await tx.organizationMember.create({
      data: {
        organizationId: actor.organizationId,
        userId: user.id,
        roleId: role.id,
        status: "INVITED",
      },
      include: memberInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Invited user",
        entityType: "OrganizationMember",
        entityId: membership.id,
        newValue: {
          email,
          roleKey: input.roleKey,
          userId: user.id,
        },
      },
      tx,
    );

    return membership;
  });

  const rawToken = await issueInviteToken({
    userId: result.userId,
    organizationId: actor.organizationId,
  });

  const inviteUrl = appUrl(`/reset-password?token=${rawToken}`);

  void emailService
    .sendInviteEmail(email, {
      name: input.name,
      organizationName: organization.name,
      inviteUrl,
      roleName: role.name,
    })
    .catch(() => undefined);

  logger.info("User invited", {
    operation: "users.invite",
    organizationId: actor.organizationId,
    membershipId: result.id,
    invitedBy: actor.userId,
  });

  return serializeMember(result);
}

export async function updateMemberRole(
  actor: TenantActor,
  input: UpdateMemberRoleInput,
) {
  assertAssignableRole(input.roleKey, actor.roleKey ?? "");

  const member = await prisma.organizationMember.findFirst({
    where: {
      id: input.membershipId,
      organizationId: actor.organizationId,
    },
    include: memberInclude,
  });
  if (!member) {
    throw new NotFoundError("Member not found");
  }

  const currentRoleKey = member.role.key;
  const activeOwnerCount = await countActiveOwners(actor.organizationId);

  assertCanDemoteOwner({
    currentRoleKey,
    nextRoleKey: input.roleKey,
    activeOwnerCount,
  });

  if (currentRoleKey === input.roleKey) {
    return serializeMember(member);
  }

  const role = await getSystemRole(input.roleKey);

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.organizationMember.update({
      where: { id: member.id },
      data: { roleId: role.id },
      include: memberInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Changed member role",
        entityType: "OrganizationMember",
        entityId: member.id,
        oldValue: { roleKey: currentRoleKey },
        newValue: { roleKey: input.roleKey },
      },
      tx,
    );

    return next;
  });

  logger.info("Member role updated", {
    operation: "users.updateRole",
    organizationId: actor.organizationId,
    membershipId: member.id,
  });

  return serializeMember(updated);
}

export async function suspendMember(
  actor: TenantActor,
  input: SuspendMemberInput,
) {
  const member = await prisma.organizationMember.findFirst({
    where: {
      id: input.membershipId,
      organizationId: actor.organizationId,
    },
    include: memberInclude,
  });
  if (!member) {
    throw new NotFoundError("Member not found");
  }

  if (member.userId === actor.userId) {
    throw new BusinessRuleError("You cannot suspend your own membership");
  }

  if (member.status === "SUSPENDED") {
    return serializeMember(member);
  }

  const activeOwnerCount = await countActiveOwners(actor.organizationId);
  assertCanSuspendOwner({
    roleKey: member.role.key,
    activeOwnerCount,
  });

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.organizationMember.update({
      where: { id: member.id },
      data: { status: "SUSPENDED" },
      include: memberInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Suspended member",
        entityType: "OrganizationMember",
        entityId: member.id,
        oldValue: { status: member.status },
        newValue: { status: "SUSPENDED" },
      },
      tx,
    );

    return next;
  });

  return serializeMember(updated);
}

export async function resendInvite(actor: TenantActor, membershipId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: {
      id: membershipId,
      organizationId: actor.organizationId,
      status: "INVITED",
    },
    include: {
      ...memberInclude,
      organization: { select: { name: true } },
    },
  });
  if (!member) {
    throw new NotFoundError("Pending invite not found");
  }

  const rawToken = await issueInviteToken({
    userId: member.userId,
    organizationId: actor.organizationId,
  });

  const inviteUrl = appUrl(`/reset-password?token=${rawToken}`);

  void emailService
    .sendInviteEmail(member.user.email, {
      name: member.user.name,
      organizationName: member.organization.name,
      inviteUrl,
      roleName: member.role.name,
    })
    .catch(() => undefined);

  return serializeMember(member);
}
