import { prisma } from "@/lib/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { tenantWhere } from "@/lib/tenant";
import { writeAuditLog } from "@/lib/audit";
import { createNotifications } from "@/lib/notifications";
import { emailService } from "@/lib/email/email-service";
import { logger } from "@/lib/logging/logger";
import {
  AuthorizationError,
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";
import { hasPermission } from "@/config/permissions";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
} from "@/lib/ui/list-sort";
import {
  ACTIVE_BID_STATUSES,
  assertCanCancelBidRequest,
  assertCanCloseBidRequest,
  assertCanEditBidRequest,
  assertCanNegotiate,
  assertCanOpenBidRequest,
  assertCanPauseBidRequest,
  assertCanRejectBid,
  assertCanShortlistBid,
  assertCanWithdrawBid,
  canAcceptBid,
  canSubmitBid,
  scoreBid,
  validateBidValues,
} from "@/modules/bidding/rules";
import type {
  BidListFilter,
  BidRequestListFilter,
  CreateBidRequestInput,
  NegotiateBidInput,
  SubmitBidInput,
  UpdateBidInput,
  UpdateBidRequestInput,
} from "@/modules/bidding/validation";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
  roleKey?: string;
};

const bidRequestInclude = {
  project: {
    select: {
      id: true,
      name: true,
      status: true,
      archivedAt: true,
      client: {
        select: {
          id: true,
          company: { select: { name: true } },
        },
      },
    },
  },
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  awardedBid: {
    select: {
      id: true,
      amount: true,
      estimatedDays: true,
      bidder: { select: { id: true, name: true, email: true } },
    },
  },
  _count: {
    select: { bids: true },
  },
} satisfies Prisma.BidRequestInclude;

const bidInclude = {
  bidRequest: {
    select: {
      id: true,
      title: true,
      status: true,
      awardedBidId: true,
      currency: true,
      projectId: true,
      project: { select: { id: true, name: true } },
    },
  },
  bidder: {
    select: { id: true, name: true, email: true },
  },
  resource: {
    select: {
      id: true,
      type: true,
      hourlyRate: true,
      experienceYears: true,
      rating: true,
      availabilityStatus: true,
      skills: {
        include: { skill: { select: { id: true, name: true } } },
      },
    },
  },
  negotiations: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  },
} satisfies Prisma.BidInclude;

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

function toNumber(value: { toString(): string } | null | undefined) {
  return value ? Number(value.toString()) : 0;
}

function emptyToNull(value: string | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function parseOptionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("Invalid date");
  }
  return date;
}

function parseMoney(value: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new ValidationError("Amount must be a non-negative number");
  }
  return parsed;
}

function canViewAllBids(actor: TenantActor) {
  return hasPermission(actor.permissions ?? [], "BID_SHORTLIST")
    || hasPermission(actor.permissions ?? [], "BID_ACCEPT")
    || hasPermission(actor.permissions ?? [], "BID_REJECT");
}

export function serializeBidRequest(
  request: Prisma.BidRequestGetPayload<{ include: typeof bidRequestInclude }>,
) {
  return {
    id: request.id,
    projectId: request.projectId,
    project: {
      id: request.project.id,
      name: request.project.name,
      status: request.project.status,
      clientName: request.project.client.company.name,
    },
    title: request.title,
    description: request.description,
    budgetMin: moneyString(request.budgetMin),
    budgetMax: moneyString(request.budgetMax),
    currency: request.currency,
    deadline: request.deadline,
    biddingType: request.biddingType,
    status: request.status,
    startsAt: request.startsAt,
    endsAt: request.endsAt,
    createdById: request.createdById,
    createdBy: request.createdBy,
    awardedBidId: request.awardedBidId,
    awardedBid: request.awardedBid
      ? {
          id: request.awardedBid.id,
          amount: moneyString(request.awardedBid.amount),
          estimatedDays: request.awardedBid.estimatedDays,
          bidder: request.awardedBid.bidder,
        }
      : null,
    bidCount: request._count.bids,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

export type SerializedBidRequest = ReturnType<typeof serializeBidRequest>;

export function serializeBid(
  bid: Prisma.BidGetPayload<{ include: typeof bidInclude }>,
  options?: { includeScore?: boolean; score?: ReturnType<typeof scoreBid> | null },
) {
  return {
    id: bid.id,
    bidRequestId: bid.bidRequestId,
    bidRequest: bid.bidRequest,
    bidderId: bid.bidderId,
    bidder: bid.bidder,
    resourceId: bid.resourceId,
    resource: bid.resource
      ? {
          id: bid.resource.id,
          type: bid.resource.type,
          hourlyRate: moneyString(bid.resource.hourlyRate),
          experienceYears: bid.resource.experienceYears,
          rating: moneyString(bid.resource.rating),
          availabilityStatus: bid.resource.availabilityStatus,
          skills: bid.resource.skills.map((row) => ({
            id: row.skill.id,
            name: row.skill.name,
          })),
        }
      : null,
    amount: moneyString(bid.amount),
    estimatedDays: bid.estimatedDays,
    proposal: bid.proposal,
    status: bid.status,
    submittedAt: bid.submittedAt,
    negotiations: bid.negotiations.map((row) => ({
      id: row.id,
      senderId: row.senderId,
      sender: row.sender,
      amount: moneyString(row.amount),
      estimatedDays: row.estimatedDays,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
    })),
    score: options?.score
      ? {
          total: options.score.total,
          price: options.score.breakdown.price,
          experience: options.score.breakdown.experience,
          rating: options.score.breakdown.rating,
          delivery: options.score.breakdown.delivery,
        }
      : null,
    createdAt: bid.createdAt,
    updatedAt: bid.updatedAt,
  };
}

export type SerializedBid = ReturnType<typeof serializeBid>;

async function getTenantBidRequest(actor: TenantActor, id: string) {
  const request = await prisma.bidRequest.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: bidRequestInclude,
  });
  if (!request) {
    throw new NotFoundError("Bid request not found");
  }
  return request;
}

async function getTenantBid(actor: TenantActor, id: string) {
  const bid = await prisma.bid.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: bidInclude,
  });
  if (!bid) {
    throw new NotFoundError("Bid not found");
  }
  return bid;
}

function assertBidVisible(actor: TenantActor, bid: { bidderId: string }) {
  if (canViewAllBids(actor) || bid.bidderId === actor.userId) {
    return;
  }
  throw new AuthorizationError("You can only view your own bids");
}

function listRequestWhere(
  organizationId: string,
  filter: BidRequestListFilter,
): Prisma.BidRequestWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const search = filter.search?.trim();
  const and: Prisma.BidRequestWhereInput[] = [];
  const newestFirst = isNewestFirst(filter.sort);

  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (decoded) {
    and.push(createdAtCursorWhere(decoded, newestFirst));
  }

  return tenantWhere(organizationId, {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.projectId ? { projectId: filter.projectId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listBidRequests(actor: TenantActor, filter: BidRequestListFilter) {
  const first = filter.first ?? 20;
  const where = listRequestWhere(actor.organizationId, filter);
  const newestFirst = isNewestFirst(filter.sort);

  const rows = await prisma.bidRequest.findMany({
    where,
    include: bidRequestInclude,
    orderBy: [...createdAtOrderBy(newestFirst)],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map(serializeBidRequest),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.bidRequest.count({
      where: listRequestWhere(actor.organizationId, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getBidRequest(actor: TenantActor, id: string) {
  return serializeBidRequest(await getTenantBidRequest(actor, id));
}

export async function listBiddingProjectOptions(actor: TenantActor) {
  return prisma.project.findMany({
    where: {
      organizationId: actor.organizationId,
      archivedAt: null,
      status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] },
    },
    select: {
      id: true,
      name: true,
      status: true,
      client: { select: { company: { select: { name: true } } } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });
}

export async function createBidRequest(actor: TenantActor, input: CreateBidRequestInput) {
  const project = await prisma.project.findFirst({
    where: {
      id: input.projectId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    select: { id: true, status: true },
  });
  if (!project) {
    throw new NotFoundError("Project not found");
  }
  if (["COMPLETED", "CLOSED", "CANCELLED"].includes(project.status)) {
    throw new BusinessRuleError("Closed projects cannot open bidding");
  }

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.bidRequest.create({
      data: {
        organizationId: actor.organizationId,
        projectId: project.id,
        title: input.title,
        description: emptyToNull(input.description),
        budgetMin: input.budgetMin ? parseMoney(input.budgetMin) : null,
        budgetMax: input.budgetMax ? parseMoney(input.budgetMax) : null,
        currency: input.currency ?? "USD",
        deadline: parseOptionalDate(input.deadline),
        biddingType: input.biddingType ?? "EXTERNAL",
        status: "DRAFT",
        startsAt: parseOptionalDate(input.startsAt),
        endsAt: parseOptionalDate(input.endsAt),
        createdById: actor.userId,
      },
      include: bidRequestInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Created bid request",
        entityType: "BidRequest",
        entityId: created.id,
        newValue: { title: created.title, projectId: created.projectId },
      },
      tx,
    );

    return created;
  });

  logger.info("Bid request created", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: request.id,
    operation: "bidRequest.create",
  });

  return serializeBidRequest(request);
}

export async function updateBidRequest(
  actor: TenantActor,
  id: string,
  input: UpdateBidRequestInput,
) {
  const existing = await getTenantBidRequest(actor, id);
  assertCanEditBidRequest(existing);

  if (input.projectId && input.projectId !== existing.projectId) {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        organizationId: actor.organizationId,
        archivedAt: null,
      },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundError("Project not found");
    }
  }

  const request = await prisma.$transaction(async (tx) => {
    const updated = await tx.bidRequest.update({
      where: { id: existing.id },
      data: {
        ...(input.projectId !== undefined ? { projectId: input.projectId } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: emptyToNull(input.description) }
          : {}),
        ...(input.budgetMin !== undefined
          ? { budgetMin: input.budgetMin ? parseMoney(input.budgetMin) : null }
          : {}),
        ...(input.budgetMax !== undefined
          ? { budgetMax: input.budgetMax ? parseMoney(input.budgetMax) : null }
          : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.deadline !== undefined
          ? { deadline: parseOptionalDate(input.deadline) }
          : {}),
        ...(input.biddingType !== undefined ? { biddingType: input.biddingType } : {}),
        ...(input.startsAt !== undefined
          ? { startsAt: parseOptionalDate(input.startsAt) }
          : {}),
        ...(input.endsAt !== undefined ? { endsAt: parseOptionalDate(input.endsAt) } : {}),
      },
      include: bidRequestInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated bid request",
        entityType: "BidRequest",
        entityId: updated.id,
      },
      tx,
    );

    return updated;
  });

  return serializeBidRequest(request);
}

async function transitionBidRequest(
  actor: TenantActor,
  id: string,
  nextStatus: "OPEN" | "PAUSED" | "CLOSED" | "CANCELLED",
  action: string,
  assertFn: (request: BidRequestStateLike) => void,
) {
  const existing = await getTenantBidRequest(actor, id);
  assertFn(existing);

  const request = await prisma.$transaction(async (tx) => {
    const updated = await tx.bidRequest.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        ...(nextStatus === "OPEN" && !existing.startsAt ? { startsAt: new Date() } : {}),
      },
      include: bidRequestInclude,
    });

    if (nextStatus === "OPEN") {
      await tx.project.update({
        where: { id: existing.projectId },
        data: { status: "BIDDING" },
      });
    }

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action,
        entityType: "BidRequest",
        entityId: updated.id,
        oldValue: { status: existing.status },
        newValue: { status: updated.status },
      },
      tx,
    );

    return updated;
  });

  return serializeBidRequest(request);
}

type BidRequestStateLike = {
  status: string;
  awardedBidId: string | null;
};

export async function openBidRequest(actor: TenantActor, id: string) {
  return transitionBidRequest(actor, id, "OPEN", "Opened bid request", assertCanOpenBidRequest);
}

export async function pauseBidRequest(actor: TenantActor, id: string) {
  return transitionBidRequest(actor, id, "PAUSED", "Paused bid request", assertCanPauseBidRequest);
}

export async function closeBidRequest(actor: TenantActor, id: string) {
  return transitionBidRequest(actor, id, "CLOSED", "Closed bid request", assertCanCloseBidRequest);
}

export async function cancelBidRequest(actor: TenantActor, id: string) {
  return transitionBidRequest(
    actor,
    id,
    "CANCELLED",
    "Cancelled bid request",
    assertCanCancelBidRequest,
  );
}

function listBidWhere(
  actor: TenantActor,
  filter: BidListFilter,
): Prisma.BidWhereInput {
  const decoded = filter.cursor ? decodeCursor(filter.cursor) : null;
  const and: Prisma.BidWhereInput[] = [];

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

  const mineOnly = filter.mineOnly || !canViewAllBids(actor);

  return tenantWhere(actor.organizationId, {
    ...(filter.bidRequestId ? { bidRequestId: filter.bidRequestId } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(mineOnly ? { bidderId: actor.userId } : {}),
    ...(and.length ? { AND: and } : {}),
  });
}

export async function listBids(actor: TenantActor, filter: BidListFilter) {
  const first = filter.first ?? 20;
  const where = listBidWhere(actor, filter);

  const rows = await prisma.bid.findMany({
    where,
    include: bidInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: first + 1,
  });

  const hasNextPage = rows.length > first;
  const slice = hasNextPage ? rows.slice(0, first) : rows;
  const end = slice[slice.length - 1];

  return {
    nodes: slice.map((bid) => serializeBid(bid)),
    pageInfo: {
      hasNextPage,
      endCursor: end ? encodeCursor(end.createdAt, end.id) : null,
    },
    totalCount: await prisma.bid.count({
      where: listBidWhere(actor, { ...filter, cursor: undefined }),
    }),
  };
}

export async function getBid(actor: TenantActor, id: string) {
  const bid = await getTenantBid(actor, id);
  assertBidVisible(actor, bid);
  return serializeBid(bid);
}

export async function listBidsForComparison(actor: TenantActor, bidRequestId: string) {
  if (!canViewAllBids(actor)) {
    throw new AuthorizationError("Missing permission to compare bids");
  }

  const request = await getTenantBidRequest(actor, bidRequestId);
  const bids = await prisma.bid.findMany({
    where: {
      organizationId: actor.organizationId,
      bidRequestId,
      status: { notIn: ["DRAFT", "WITHDRAWN"] },
    },
    include: bidInclude,
    orderBy: [{ amount: "asc" }, { estimatedDays: "asc" }],
  });

  const amounts = bids.map((bid) => toNumber(bid.amount));
  const days = bids.map((bid) => bid.estimatedDays);
  const experiences = bids.map((bid) => bid.resource?.experienceYears ?? 0);
  const minAmount = amounts.length ? Math.min(...amounts) : 0;
  const maxAmount = amounts.length ? Math.max(...amounts) : 0;
  const minDays = days.length ? Math.min(...days) : 0;
  const maxDays = days.length ? Math.max(...days) : 0;
  const maxExperience = experiences.length ? Math.max(...experiences) : 0;

  return {
    request: serializeBidRequest(request),
    bids: bids.map((bid) =>
      serializeBid(bid, {
        score: scoreBid({
          amount: toNumber(bid.amount),
          experienceYears: bid.resource?.experienceYears ?? 0,
          rating: toNumber(bid.resource?.rating),
          estimatedDays: bid.estimatedDays,
          minAmount,
          maxAmount,
          minDays,
          maxDays,
          maxExperience,
        }),
      }),
    ),
  };
}

export async function submitBid(actor: TenantActor, input: SubmitBidInput) {
  const request = await getTenantBidRequest(actor, input.bidRequestId);
  const submitError = canSubmitBid(request);
  if (submitError) {
    throw new BusinessRuleError(submitError);
  }

  const amount = parseMoney(input.amount);
  const valuesError = validateBidValues(amount, input.estimatedDays);
  if (valuesError) {
    throw new BusinessRuleError(valuesError);
  }

  const resource = await prisma.resource.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId: actor.userId,
    },
    select: { id: true },
  });

  const existing = await prisma.bid.findFirst({
    where: {
      bidRequestId: request.id,
      bidderId: actor.userId,
      organizationId: actor.organizationId,
    },
  });

  if (existing && !["DRAFT", "WITHDRAWN"].includes(existing.status)) {
    throw new BusinessRuleError("You already have an active bid on this request");
  }

  const bid = await prisma.$transaction(async (tx) => {
    const data = {
      organizationId: actor.organizationId,
      bidRequestId: request.id,
      bidderId: actor.userId,
      resourceId: resource?.id ?? null,
      amount,
      estimatedDays: input.estimatedDays,
      proposal: emptyToNull(input.proposal),
      status: "SUBMITTED" as const,
      submittedAt: new Date(),
    };

    const saved = existing
      ? await tx.bid.update({
          where: { id: existing.id },
          data,
          include: bidInclude,
        })
      : await tx.bid.create({
          data,
          include: bidInclude,
        });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Submitted bid",
        entityType: "Bid",
        entityId: saved.id,
        newValue: { bidRequestId: request.id, amount, estimatedDays: input.estimatedDays },
      },
      tx,
    );

    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: [request.createdById],
        excludeUserId: actor.userId,
        type: "BID_SUBMITTED",
        title: "New bid submitted",
        message: `A bid was submitted on “${request.title}”.`,
        entityType: "BidRequest",
        entityId: request.id,
      },
      tx,
    );

    return saved;
  });

  const creator = await prisma.user.findFirst({
    where: { id: request.createdById },
    select: { email: true },
  });
  if (creator?.email && request.createdById !== actor.userId) {
    void emailService.sendBidNotification(creator.email, request.title).catch(() => undefined);
  }

  return serializeBid(bid);
}

export async function updateMyBid(actor: TenantActor, id: string, input: UpdateBidInput) {
  const bid = await getTenantBid(actor, id);
  if (bid.bidderId !== actor.userId) {
    throw new AuthorizationError("You can only update your own bids");
  }
  if (!ACTIVE_BID_STATUSES.includes(bid.status as (typeof ACTIVE_BID_STATUSES)[number])) {
    throw new BusinessRuleError("Only active bids can be updated");
  }

  const request = await getTenantBidRequest(actor, bid.bidRequestId);
  const submitError = canSubmitBid(request);
  if (submitError && bid.status !== "DRAFT") {
    throw new BusinessRuleError(submitError);
  }

  const amount = input.amount !== undefined ? parseMoney(input.amount) : toNumber(bid.amount);
  const estimatedDays = input.estimatedDays ?? bid.estimatedDays;
  const valuesError = validateBidValues(amount, estimatedDays);
  if (valuesError) {
    throw new BusinessRuleError(valuesError);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.bid.update({
      where: { id: bid.id },
      data: {
        amount,
        estimatedDays,
        ...(input.proposal !== undefined ? { proposal: emptyToNull(input.proposal) } : {}),
      },
      include: bidInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Updated bid",
        entityType: "Bid",
        entityId: saved.id,
      },
      tx,
    );

    return saved;
  });

  return serializeBid(updated);
}

export async function withdrawBid(actor: TenantActor, id: string) {
  const bid = await getTenantBid(actor, id);
  if (bid.bidderId !== actor.userId && !canViewAllBids(actor)) {
    throw new AuthorizationError("You can only withdraw your own bids");
  }
  assertCanWithdrawBid(bid);

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.bid.update({
      where: { id: bid.id },
      data: { status: "WITHDRAWN" },
      include: bidInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Withdrew bid",
        entityType: "Bid",
        entityId: saved.id,
      },
      tx,
    );

    return saved;
  });

  return serializeBid(updated);
}

export async function shortlistBid(actor: TenantActor, id: string) {
  const bid = await getTenantBid(actor, id);
  const request = await getTenantBidRequest(actor, bid.bidRequestId);
  assertCanShortlistBid(bid, request);

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.bid.update({
      where: { id: bid.id },
      data: { status: "SHORTLISTED" },
      include: bidInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Shortlisted bid",
        entityType: "Bid",
        entityId: saved.id,
      },
      tx,
    );

    return saved;
  });

  return serializeBid(updated);
}

export async function rejectBid(actor: TenantActor, id: string) {
  const bid = await getTenantBid(actor, id);
  const request = await getTenantBidRequest(actor, bid.bidRequestId);
  assertCanRejectBid(bid, request);

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.bid.update({
      where: { id: bid.id },
      data: { status: "REJECTED" },
      include: bidInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Rejected bid",
        entityType: "Bid",
        entityId: saved.id,
      },
      tx,
    );

    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: [bid.bidderId],
        excludeUserId: actor.userId,
        type: "BID_REJECTED",
        title: "Bid not selected",
        message: `Your bid on “${request.title}” was rejected.`,
        entityType: "Bid",
        entityId: saved.id,
      },
      tx,
    );

    return saved;
  });

  if (bid.bidderId !== actor.userId && bid.bidder?.email) {
    void emailService.sendBidRejected(bid.bidder.email, request.title).catch(() => undefined);
  }

  return serializeBid(updated);
}

export async function negotiateBid(
  actor: TenantActor,
  id: string,
  input: NegotiateBidInput,
) {
  const bid = await getTenantBid(actor, id);
  const request = await getTenantBidRequest(actor, bid.bidRequestId);

  const isOwner = bid.bidderId === actor.userId;
  if (!isOwner && !canViewAllBids(actor)) {
    throw new AuthorizationError("You cannot negotiate this bid");
  }

  assertCanNegotiate(bid, request);

  const amount = parseMoney(input.amount);
  const valuesError = validateBidValues(amount, input.estimatedDays);
  if (valuesError) {
    throw new BusinessRuleError(valuesError);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.bidNegotiation.create({
      data: {
        bidId: bid.id,
        senderId: actor.userId,
        amount,
        estimatedDays: input.estimatedDays,
        message: emptyToNull(input.message),
        status: "COUNTER_OFFER",
      },
    });

    const saved = await tx.bid.update({
      where: { id: bid.id },
      data: { status: "NEGOTIATION" },
      include: bidInclude,
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Added bid negotiation",
        entityType: "Bid",
        entityId: saved.id,
        newValue: { amount, estimatedDays: input.estimatedDays },
      },
      tx,
    );

    return saved;
  });

  return serializeBid(updated);
}

export async function acceptBid(actor: TenantActor, id: string) {
  const result = await prisma.$transaction(async (tx) => {
    const bid = await tx.bid.findFirst({
      where: { id, organizationId: actor.organizationId },
      include: bidInclude,
    });
    if (!bid) {
      throw new NotFoundError("Bid not found");
    }

    const request = await tx.bidRequest.findFirst({
      where: { id: bid.bidRequestId, organizationId: actor.organizationId },
    });
    if (!request) {
      throw new NotFoundError("Bid request not found");
    }

    const acceptError = canAcceptBid(
      request,
      {
        id: bid.id,
        bidRequestId: bid.bidRequestId,
        status: bid.status,
        amount: toNumber(bid.amount),
        estimatedDays: bid.estimatedDays,
      },
      request.id,
    );
    if (acceptError) {
      throw new BusinessRuleError(acceptError);
    }

    const locked = await tx.bidRequest.updateMany({
      where: {
        id: request.id,
        organizationId: actor.organizationId,
        awardedBidId: null,
        status: { in: ["OPEN", "PAUSED"] },
      },
      data: {
        awardedBidId: bid.id,
        status: "AWARDED",
      },
    });
    if (locked.count !== 1) {
      throw new BusinessRuleError("A winning bid already exists");
    }

    await tx.bid.update({
      where: { id: bid.id },
      data: { status: "ACCEPTED" },
    });

    await tx.bid.updateMany({
      where: {
        bidRequestId: request.id,
        organizationId: actor.organizationId,
        id: { not: bid.id },
        status: { in: [...ACTIVE_BID_STATUSES] },
      },
      data: { status: "REJECTED" },
    });

    if (bid.resourceId) {
      await tx.projectMember.upsert({
        where: {
          projectId_resourceId: {
            projectId: request.projectId,
            resourceId: bid.resourceId,
          },
        },
        create: {
          organizationId: actor.organizationId,
          projectId: request.projectId,
          resourceId: bid.resourceId,
          role: "Assigned via bid",
        },
        update: {},
      });
    }

    await tx.project.update({
      where: { id: request.projectId },
      data: { status: "RESOURCE_ASSIGNED" },
    });

    await writeAuditLog(
      {
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: "Accepted bid",
        entityType: "Bid",
        entityId: bid.id,
        newValue: {
          bidRequestId: request.id,
          projectId: request.projectId,
          amount: moneyString(bid.amount),
        },
      },
      tx,
    );

    const rejected = await tx.bid.findMany({
      where: {
        bidRequestId: request.id,
        organizationId: actor.organizationId,
        id: { not: bid.id },
        status: "REJECTED",
      },
      select: { id: true, bidderId: true },
    });

    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: [bid.bidderId],
        excludeUserId: actor.userId,
        type: "BID_ACCEPTED",
        title: "Bid accepted",
        message: `Your bid on “${request.title}” was accepted.`,
        entityType: "Bid",
        entityId: bid.id,
      },
      tx,
    );

    await createNotifications(
      {
        organizationId: actor.organizationId,
        userIds: rejected.map((row) => row.bidderId),
        excludeUserId: actor.userId,
        type: "BID_REJECTED",
        title: "Bid not selected",
        message: `Another bid was accepted for “${request.title}”.`,
        entityType: "BidRequest",
        entityId: request.id,
      },
      tx,
    );

    return tx.bid.findFirstOrThrow({
      where: { id: bid.id },
      include: bidInclude,
    });
  });

  logger.info("Bid accepted", {
    userId: actor.userId,
    organizationId: actor.organizationId,
    entityId: result.id,
    operation: "bid.accept",
  });

  if (result.bidderId !== actor.userId && result.bidder?.email) {
    void emailService.sendBidAccepted(result.bidder.email, result.bidRequest.title).catch(
      () => undefined,
    );
  }

  return serializeBid(result);
}

export async function getBiddingSummary(actor: TenantActor) {
  const [openRequests, awardedRequests, submittedBids] = await Promise.all([
    prisma.bidRequest.count({
      where: {
        organizationId: actor.organizationId,
        status: "OPEN",
      },
    }),
    prisma.bidRequest.count({
      where: {
        organizationId: actor.organizationId,
        status: "AWARDED",
      },
    }),
    prisma.bid.count({
      where: {
        organizationId: actor.organizationId,
        status: { in: ["SUBMITTED", "SHORTLISTED", "NEGOTIATION"] },
      },
    }),
  ]);

  return { openRequests, awardedRequests, submittedBids };
}
