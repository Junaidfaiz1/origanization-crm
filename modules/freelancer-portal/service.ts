import { prisma } from "@/lib/prisma/client";
import {
  AuthorizationError,
  NotFoundError,
} from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import { assertFreelancerPortalActor } from "@/modules/freelancer-portal/rules";
import {
  getBid,
  getBidRequest,
  listBidRequests,
  listBids,
} from "@/modules/bidding/service";
import { getTask, listTasks } from "@/modules/tasks/service";
import {
  getActiveTimeEntry,
  getTimeEntry,
  listTimeEntries,
} from "@/modules/time-tracking/service";

type PortalActor = {
  userId: string;
  organizationId: string;
  roleKey?: string;
  permissions?: string[];
};

function moneyString(value: { toString(): string } | null | undefined) {
  return value ? value.toString() : null;
}

export async function requireFreelancerActor(actor: PortalActor) {
  assertFreelancerPortalActor(actor.roleKey);
  return actor;
}

export async function getFreelancerProfile(actor: PortalActor) {
  await requireFreelancerActor(actor);

  const resource = await prisma.resource.findFirst({
    where: {
      organizationId: actor.organizationId,
      userId: actor.userId,
    },
    select: {
      id: true,
      type: true,
      hourlyRate: true,
      experienceYears: true,
      availabilityStatus: true,
      rating: true,
      bio: true,
      skills: {
        include: { skill: { select: { id: true, name: true } } },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!resource) {
    return null;
  }

  return {
    id: resource.id,
    name: resource.user.name,
    email: resource.user.email,
    type: resource.type,
    hourlyRate: moneyString(resource.hourlyRate),
    experienceYears: resource.experienceYears,
    availabilityStatus: resource.availabilityStatus,
    rating: moneyString(resource.rating),
    bio: resource.bio,
    skills: resource.skills.map((row) => ({
      id: row.skill.id,
      name: row.skill.name,
    })),
  };
}

export async function getFreelancerHome(actor: PortalActor) {
  await requireFreelancerActor(actor);

  const [openRequests, myBids, myTasks, timeEntries, profile, activeTimer] =
    await Promise.all([
      listBidRequests(actor, { status: "OPEN", first: 5 }),
      listBids(actor, { mineOnly: true, first: 5 }),
      listTasks(actor, { mineOnly: true, first: 5 }),
      listTimeEntries(actor, { first: 5, billable: undefined, runningOnly: false }),
      getFreelancerProfile(actor),
      getActiveTimeEntry(actor),
    ]);

  const openRequestCount = await prisma.bidRequest.count({
    where: {
      organizationId: actor.organizationId,
      status: "OPEN",
    },
  });
  const myBidCount = await prisma.bid.count({
    where: {
      organizationId: actor.organizationId,
      bidderId: actor.userId,
      status: { not: "WITHDRAWN" },
    },
  });
  const myTaskCount = await prisma.task.count({
    where: {
      organizationId: actor.organizationId,
      assignedToId: actor.userId,
      status: { not: "DONE" },
    },
  });

  return {
    profile,
    activeTimer,
    counts: {
      openRequests: openRequestCount,
      myBids: myBidCount,
      activeTasks: myTaskCount,
    },
    openRequests: openRequests.nodes.map((request) => ({
      id: request.id,
      title: request.title,
      projectName: request.project.name,
      status: request.status,
      budgetMin: request.budgetMin,
      budgetMax: request.budgetMax,
      currency: request.currency,
      endsAt: request.endsAt,
    })),
    myBids: myBids.nodes.map((bid) => ({
      id: bid.id,
      title: bid.bidRequest.title,
      status: bid.status,
      amount: bid.amount,
      currency: bid.bidRequest.currency,
      estimatedDays: bid.estimatedDays,
    })),
    myTasks: myTasks.nodes.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      projectName: task.project.name,
      dueDate: task.dueDate,
    })),
    recentTime: timeEntries.nodes.map((entry) => ({
      id: entry.id,
      projectName: entry.project.name,
      durationSeconds: entry.durationSeconds,
      billable: entry.billable,
      startedAt: entry.startedAt,
    })),
  };
}

export async function listFreelancerOpenRequests(actor: PortalActor) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "BID_REQUEST_VIEW")) {
    throw new AuthorizationError("Missing BID_REQUEST_VIEW");
  }

  const result = await listBidRequests(actor, { status: "OPEN", first: 50 });
  return result.nodes.map((request) => sanitizeBidRequest(request, actor.userId));
}

export async function getFreelancerBidRequest(actor: PortalActor, id: string) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "BID_REQUEST_VIEW")) {
    throw new AuthorizationError("Missing BID_REQUEST_VIEW");
  }

  const request = await getBidRequest(actor, id);

  const myBid = await prisma.bid.findFirst({
    where: {
      organizationId: actor.organizationId,
      bidRequestId: id,
      bidderId: actor.userId,
      status: { not: "WITHDRAWN" },
    },
    select: { id: true, status: true, amount: true },
  });

  // Open requests are eligible; other statuses only if this freelancer already bid.
  if (request.status !== "OPEN" && !myBid) {
    throw new NotFoundError("Bid request not found");
  }

  return {
    ...sanitizeBidRequest(request, actor.userId),
    myBid: myBid
      ? {
          id: myBid.id,
          status: myBid.status,
          amount: moneyString(myBid.amount),
        }
      : null,
  };
}

function sanitizeBidRequest(
  request: Awaited<ReturnType<typeof getBidRequest>>,
  userId: string,
) {
  const awardedIsMine = request.awardedBid?.bidder?.id === userId;
  return {
    id: request.id,
    title: request.title,
    description: request.description,
    status: request.status,
    currency: request.currency,
    budgetMin: request.budgetMin,
    budgetMax: request.budgetMax,
    deadline: request.deadline,
    startsAt: request.startsAt,
    endsAt: request.endsAt,
    biddingType: request.biddingType,
    project: {
      id: request.project.id,
      name: request.project.name,
      status: request.project.status,
      // Client company name is OK; no internal notes
      clientName: request.project.clientName,
    },
    bidCount: request.bidCount,
    awardedBidId: request.awardedBidId,
    // Only expose awarded amount if this freelancer won
    awardedBid:
      request.awardedBid && awardedIsMine
        ? {
            id: request.awardedBid.id,
            amount: request.awardedBid.amount,
            estimatedDays: request.awardedBid.estimatedDays,
          }
        : request.awardedBidId
          ? { id: request.awardedBidId, wonByOther: true as const }
          : null,
  };
}

export async function listFreelancerBids(actor: PortalActor) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "BID_VIEW")) {
    throw new AuthorizationError("Missing BID_VIEW");
  }
  const result = await listBids(actor, { mineOnly: true, first: 50 });
  return result.nodes;
}

export async function getFreelancerBid(actor: PortalActor, id: string) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "BID_VIEW")) {
    throw new AuthorizationError("Missing BID_VIEW");
  }
  const bid = await getBid(actor, id);
  if (bid.bidderId !== actor.userId) {
    throw new NotFoundError("Bid not found");
  }
  return bid;
}

export async function listFreelancerTasks(actor: PortalActor) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "TASK_VIEW")) {
    throw new AuthorizationError("Missing TASK_VIEW");
  }
  const result = await listTasks(actor, { mineOnly: true, first: 50 });
  return result.nodes;
}

export async function getFreelancerTask(actor: PortalActor, id: string) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "TASK_VIEW")) {
    throw new AuthorizationError("Missing TASK_VIEW");
  }
  const task = await getTask(actor, id);
  if (task.assignedToId !== actor.userId) {
    throw new NotFoundError("Task not found");
  }
  return task;
}

export async function listFreelancerTimeEntries(actor: PortalActor) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "TIME_ENTRY_VIEW")) {
    throw new AuthorizationError("Missing TIME_ENTRY_VIEW");
  }
  const [entries, activeTimer] = await Promise.all([
    listTimeEntries(actor, { first: 50, billable: undefined, runningOnly: false }),
    getActiveTimeEntry(actor),
  ]);
  return { entries: entries.nodes, activeTimer };
}

export async function listFreelancerTimeOptions(actor: PortalActor) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "TIME_ENTRY_CREATE")) {
    throw new AuthorizationError("Missing TIME_ENTRY_CREATE");
  }

  const tasks = await prisma.task.findMany({
    where: {
      organizationId: actor.organizationId,
      assignedToId: actor.userId,
      project: {
        archivedAt: null,
        status: { notIn: ["COMPLETED", "CLOSED", "CANCELLED"] },
      },
    },
    select: {
      id: true,
      title: true,
      projectId: true,
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { title: "asc" }],
    take: 100,
  });

  const projectMap = new Map<string, { id: string; name: string }>();
  for (const task of tasks) {
    projectMap.set(task.project.id, {
      id: task.project.id,
      name: task.project.name,
    });
  }

  return {
    projects: [...projectMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
    })),
  };
}

export async function getFreelancerTimeEntry(actor: PortalActor, id: string) {
  await requireFreelancerActor(actor);
  if (!hasPermission(actor.permissions ?? [], "TIME_ENTRY_VIEW")) {
    throw new AuthorizationError("Missing TIME_ENTRY_VIEW");
  }
  const entry = await getTimeEntry(actor, id);
  if (entry.userId !== actor.userId) {
    throw new NotFoundError("Time entry not found");
  }
  return entry;
}
