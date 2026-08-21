import { prisma } from "@/lib/prisma/client";
import { calculateProfit } from "@/lib/finance/profit";
import {
  ACTIVE_PROJECT_STATUSES,
  assertCanViewReports,
  formatMarginPercent,
  formatMoney,
  formatRate,
  OUTSTANDING_INVOICE_STATUSES,
  PENDING_PROPOSAL_STATUSES,
} from "@/modules/reports/rules";
import {
  bucketAmountsByMonth,
  buildBidConversionSeries,
  buildFinanceBreakdownSeries,
  humanizeKey,
} from "@/modules/reports/charts";
import { OPPORTUNITY_STAGES, OPEN_OPPORTUNITY_STAGES } from "@/modules/opportunities/rules";
import { LEAD_STATUSES } from "@/modules/leads/rules";

type TenantActor = {
  userId: string;
  organizationId: string;
  permissions?: string[];
  roleKey?: string;
};

function toNumber(value: { toString(): string } | number | null | undefined) {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

async function sumSucceededPayments(organizationId: string) {
  const result = await prisma.payment.aggregate({
    where: {
      organizationId,
      status: "SUCCEEDED",
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

async function sumApprovedExpenses(organizationId: string) {
  const result = await prisma.expense.aggregate({
    where: {
      organizationId,
      status: "APPROVED",
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

async function sumAcceptedBidAmounts(organizationId: string) {
  const result = await prisma.bid.aggregate({
    where: {
      organizationId,
      status: "ACCEPTED",
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

async function sumOutstandingInvoiceDue(organizationId: string) {
  const result = await prisma.invoice.aggregate({
    where: {
      organizationId,
      status: { in: [...OUTSTANDING_INVOICE_STATUSES] },
    },
    _sum: { amountDue: true },
  });
  return toNumber(result._sum.amountDue);
}

function hasPerm(actor: TenantActor, permission: string) {
  return (actor.permissions ?? []).includes(permission);
}

export async function getDashboardMetrics(actor: TenantActor) {
  const orgId = actor.organizationId;
  const canViewFinance = hasPerm(actor, "REPORT_VIEW");
  const canViewLeads = hasPerm(actor, "LEAD_VIEW");
  const canViewOpportunities = hasPerm(actor, "OPPORTUNITY_VIEW");
  const canViewProjects = hasPerm(actor, "PROJECT_VIEW");
  const canViewBids = hasPerm(actor, "BID_REQUEST_VIEW");
  const canViewProposals = hasPerm(actor, "PROPOSAL_VIEW");
  const canViewInvoices = hasPerm(actor, "INVOICE_VIEW");
  const canViewTasks = hasPerm(actor, "TASK_VIEW");

  const now = new Date();
  const upcomingEnd = new Date(now);
  upcomingEnd.setDate(upcomingEnd.getDate() + 14);

  const [
    activeProjects,
    openBids,
    pendingProposals,
    outstandingInvoices,
    overdueInvoices,
    leadsCount,
    openOpportunities,
    pipelineValue,
    myOpenTasks,
    upcomingMilestones,
    revenue,
    resourceCost,
    expenses,
    recentProjects,
    recentActivity,
    upcomingMilestoneRows,
    myTaskRows,
  ] = await Promise.all([
    canViewProjects
      ? prisma.project.count({
          where: {
            organizationId: orgId,
            archivedAt: null,
            status: { in: [...ACTIVE_PROJECT_STATUSES] },
          },
        })
      : Promise.resolve(0),
    canViewBids
      ? prisma.bidRequest.count({
          where: { organizationId: orgId, status: "OPEN" },
        })
      : Promise.resolve(0),
    canViewProposals
      ? prisma.proposal.count({
          where: {
            organizationId: orgId,
            archivedAt: null,
            status: { in: [...PENDING_PROPOSAL_STATUSES] },
          },
        })
      : Promise.resolve(0),
    canViewInvoices
      ? prisma.invoice.count({
          where: {
            organizationId: orgId,
            status: { in: [...OUTSTANDING_INVOICE_STATUSES] },
          },
        })
      : Promise.resolve(0),
    canViewInvoices
      ? prisma.invoice.count({
          where: { organizationId: orgId, status: "OVERDUE" },
        })
      : Promise.resolve(0),
    canViewLeads
      ? prisma.lead.count({
          where: { organizationId: orgId, archivedAt: null },
        })
      : Promise.resolve(0),
    canViewOpportunities
      ? prisma.opportunity.count({
          where: {
            organizationId: orgId,
            archivedAt: null,
            stage: { in: [...OPEN_OPPORTUNITY_STAGES] },
          },
        })
      : Promise.resolve(0),
    canViewOpportunities
      ? prisma.opportunity
          .findMany({
            where: {
              organizationId: orgId,
              archivedAt: null,
              stage: { in: [...OPEN_OPPORTUNITY_STAGES] },
            },
            select: { estimatedValue: true },
          })
          .then((rows) =>
            rows.reduce((sum, row) => sum + toNumber(row.estimatedValue), 0),
          )
      : Promise.resolve(0),
    canViewTasks
      ? prisma.task.count({
          where: {
            organizationId: orgId,
            assignedToId: actor.userId,
            status: { not: "DONE" },
          },
        })
      : Promise.resolve(0),
    canViewProjects
      ? prisma.milestone.count({
          where: {
            project: { organizationId: orgId, archivedAt: null },
            status: { notIn: ["COMPLETED"] },
            dueDate: { gte: now, lte: upcomingEnd },
          },
        })
      : Promise.resolve(0),
    canViewFinance ? sumSucceededPayments(orgId) : Promise.resolve(0),
    canViewFinance ? sumAcceptedBidAmounts(orgId) : Promise.resolve(0),
    canViewFinance ? sumApprovedExpenses(orgId) : Promise.resolve(0),
    canViewProjects
      ? prisma.project.findMany({
          where: { organizationId: orgId, archivedAt: null },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: { id: true, name: true, status: true, budget: true },
        })
      : Promise.resolve([]),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, action: true, entityType: true, createdAt: true },
    }),
    canViewProjects
      ? prisma.milestone.findMany({
          where: {
            project: { organizationId: orgId, archivedAt: null },
            status: { notIn: ["COMPLETED"] },
            dueDate: { gte: now, lte: upcomingEnd },
          },
          orderBy: { dueDate: "asc" },
          take: 5,
          select: {
            id: true,
            name: true,
            dueDate: true,
            status: true,
            project: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
    canViewTasks
      ? prisma.task.findMany({
          where: {
            organizationId: orgId,
            assignedToId: actor.userId,
            status: { not: "DONE" },
          },
          orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
            project: { select: { id: true, name: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const profit = canViewFinance
    ? calculateProfit({
        revenue,
        resourceCost,
        expenses,
        paymentFees: 0,
      })
    : null;

  return {
    roleKey: actor.roleKey ?? null,
    canViewFinance,
    canViewLeads,
    canViewOpportunities,
    canViewProjects,
    canViewBids,
    canViewProposals,
    canViewInvoices,
    canViewTasks,
    revenue: canViewFinance ? formatMoney(revenue) : null,
    profit: profit ? formatMoney(profit.profit) : null,
    profitMargin: profit ? formatMarginPercent(profit.profitMargin) : null,
    activeProjects: canViewProjects ? activeProjects : null,
    openBids: canViewBids ? openBids : null,
    pendingProposals: canViewProposals ? pendingProposals : null,
    outstandingInvoices: canViewInvoices ? outstandingInvoices : null,
    overdueInvoices: canViewInvoices ? overdueInvoices : null,
    leadsCount: canViewLeads ? leadsCount : null,
    openOpportunities: canViewOpportunities ? openOpportunities : null,
    pipelineValue: canViewOpportunities ? formatMoney(pipelineValue) : null,
    myOpenTasks: canViewTasks ? myOpenTasks : null,
    upcomingMilestones: canViewProjects ? upcomingMilestones : null,
    recentProjects: recentProjects.map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
      budget: project.budget ? project.budget.toString() : null,
    })),
    recentActivity,
    upcomingMilestoneItems: upcomingMilestoneRows.map((row) => ({
      id: row.id,
      name: row.name,
      dueDate: row.dueDate,
      status: row.status,
      projectId: row.project.id,
      projectName: row.project.name,
    })),
    myTaskItems: myTaskRows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      dueDate: row.dueDate,
      projectId: row.project.id,
      projectName: row.project.name,
    })),
  };
}

export async function getSalesReport(actor: TenantActor) {
  assertCanViewReports(actor);
  const orgId = actor.organizationId;

  const [leads, opportunities, proposals] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: orgId, archivedAt: null },
      _count: { _all: true },
    }),
    prisma.opportunity.findMany({
      where: { organizationId: orgId, archivedAt: null },
      select: { stage: true, estimatedValue: true, probability: true },
    }),
    prisma.proposal.groupBy({
      by: ["status"],
      where: { organizationId: orgId, archivedAt: null },
      _count: { _all: true },
    }),
  ]);

  const leadTotal = leads.reduce((sum, row) => sum + row._count._all, 0);
  const converted =
    leads.find((row) => row.status === "CONVERTED")?._count._all ?? 0;
  const lostLeads = leads.find((row) => row.status === "LOST")?._count._all ?? 0;

  const open = opportunities.filter((row) =>
    OPEN_OPPORTUNITY_STAGES.includes(row.stage as (typeof OPEN_OPPORTUNITY_STAGES)[number]),
  );
  const won = opportunities.filter((row) => row.stage === "WON");
  const lost = opportunities.filter((row) => row.stage === "LOST");
  const closedCount = won.length + lost.length;

  const pipelineValue = open.reduce((sum, row) => sum + toNumber(row.estimatedValue), 0);
  const weightedValue = open.reduce(
    (sum, row) => sum + (toNumber(row.estimatedValue) * row.probability) / 100,
    0,
  );

  return {
    leads: {
      total: leadTotal,
      converted,
      lost: lostLeads,
      conversionRate: formatRate(converted, leadTotal),
      byStatus: LEAD_STATUSES.map((status) => ({
        status,
        count: leads.find((row) => row.status === status)?._count._all ?? 0,
      })),
    },
    pipeline: {
      openCount: open.length,
      wonCount: won.length,
      lostCount: lost.length,
      pipelineValue: formatMoney(pipelineValue),
      weightedValue: formatMoney(weightedValue),
      winRate: formatRate(won.length, closedCount),
      stages: OPPORTUNITY_STAGES.map((stage) => {
        const rows = opportunities.filter((row) => row.stage === stage);
        const value = rows.reduce((sum, row) => sum + toNumber(row.estimatedValue), 0);
        return {
          stage,
          count: rows.length,
          value: formatMoney(value),
        };
      }),
    },
    proposals: {
      total: proposals.reduce((sum, row) => sum + row._count._all, 0),
      accepted: proposals.find((row) => row.status === "ACCEPTED")?._count._all ?? 0,
      rejected: proposals.find((row) => row.status === "REJECTED")?._count._all ?? 0,
      pending: proposals
        .filter((row) =>
          (PENDING_PROPOSAL_STATUSES as readonly string[]).includes(row.status),
        )
        .reduce((sum, row) => sum + row._count._all, 0),
    },
  };
}

export async function getProjectsReport(actor: TenantActor) {
  assertCanViewReports(actor);
  const orgId = actor.organizationId;
  const now = new Date();

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId, archivedAt: null },
    select: {
      id: true,
      name: true,
      status: true,
      endDate: true,
      budget: true,
      estimatedCost: true,
      actualCost: true,
    },
  });

  const active = projects.filter((row) =>
    (ACTIVE_PROJECT_STATUSES as readonly string[]).includes(row.status),
  );
  const completed = projects.filter((row) => row.status === "COMPLETED");
  const delayed = active.filter(
    (row) => row.endDate != null && row.endDate.getTime() < now.getTime(),
  );

  const [revenue, resourceCost, expenses] = await Promise.all([
    sumSucceededPayments(orgId),
    sumAcceptedBidAmounts(orgId),
    sumApprovedExpenses(orgId),
  ]);
  const profit = calculateProfit({
    revenue,
    resourceCost,
    expenses,
    paymentFees: 0,
  });

  const byStatus = Array.from(
    projects.reduce((map, row) => {
      map.set(row.status, (map.get(row.status) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  ).map(([status, count]) => ({ status, count }));

  return {
    total: projects.length,
    active: active.length,
    completed: completed.length,
    delayed: delayed.length,
    budgetTotal: formatMoney(
      projects.reduce((sum, row) => sum + toNumber(row.budget), 0),
    ),
    profit: formatMoney(profit.profit),
    profitMargin: formatMarginPercent(profit.profitMargin),
    byStatus,
    delayedProjects: delayed.slice(0, 10).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      endDate: row.endDate,
    })),
  };
}

export async function getBiddingReport(actor: TenantActor) {
  assertCanViewReports(actor);
  const orgId = actor.organizationId;

  const [requests, bids, awarded] = await Promise.all([
    prisma.bidRequest.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { _all: true },
    }),
    prisma.bid.findMany({
      where: {
        organizationId: orgId,
        status: { notIn: ["DRAFT", "WITHDRAWN"] },
      },
      select: { amount: true, estimatedDays: true, status: true },
    }),
    prisma.bidRequest.count({
      where: { organizationId: orgId, status: "AWARDED" },
    }),
  ]);

  const totalRequests = requests.reduce((sum, row) => sum + row._count._all, 0);
  const openRequests = requests.find((row) => row.status === "OPEN")?._count._all ?? 0;
  const closedLike = requests
    .filter((row) => ["AWARDED", "CLOSED", "CANCELLED"].includes(row.status))
    .reduce((sum, row) => sum + row._count._all, 0);

  const amounts = bids.map((row) => toNumber(row.amount));
  const days = bids.map((row) => row.estimatedDays);
  const avgAmount =
    amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
  const avgDays =
    days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;

  return {
    requests: {
      total: totalRequests,
      open: openRequests,
      awarded,
      conversionRate: formatRate(awarded, closedLike || totalRequests),
      byStatus: requests.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    },
    bids: {
      total: bids.length,
      accepted: bids.filter((row) => row.status === "ACCEPTED").length,
      rejected: bids.filter((row) => row.status === "REJECTED").length,
      averageAmount: formatMoney(avgAmount),
      averageDays: avgDays > 0 ? Number(avgDays.toFixed(1)) : 0,
    },
  };
}

export async function getFinanceReport(actor: TenantActor) {
  assertCanViewReports(actor);
  const orgId = actor.organizationId;

  const [
    revenue,
    resourceCost,
    expenses,
    outstandingDue,
    paymentGroups,
    expenseGroups,
    invoiceGroups,
  ] = await Promise.all([
    sumSucceededPayments(orgId),
    sumAcceptedBidAmounts(orgId),
    sumApprovedExpenses(orgId),
    sumOutstandingInvoiceDue(orgId),
    prisma.payment.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { _all: true },
      _sum: { total: true, amountDue: true, amountPaid: true },
    }),
  ]);

  const profit = calculateProfit({
    revenue,
    resourceCost,
    expenses,
    paymentFees: 0,
  });

  return {
    revenue: formatMoney(revenue),
    resourceCost: formatMoney(resourceCost),
    expenses: formatMoney(expenses),
    paymentFees: formatMoney(0),
    profit: formatMoney(profit.profit),
    profitMargin: formatMarginPercent(profit.profitMargin),
    outstandingDue: formatMoney(outstandingDue),
    payments: paymentGroups.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: formatMoney(toNumber(row._sum.amount)),
    })),
    expensesByStatus: expenseGroups.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: formatMoney(toNumber(row._sum.amount)),
    })),
    invoices: invoiceGroups.map((row) => ({
      status: row.status,
      count: row._count._all,
      total: formatMoney(toNumber(row._sum.total)),
      amountDue: formatMoney(toNumber(row._sum.amountDue)),
      amountPaid: formatMoney(toNumber(row._sum.amountPaid)),
    })),
  };
}

export async function getReportsOverview(actor: TenantActor) {
  assertCanViewReports(actor);
  const [sales, projects, bidding, finance, charts] = await Promise.all([
    getSalesReport(actor),
    getProjectsReport(actor),
    getBiddingReport(actor),
    getFinanceReport(actor),
    getReportCharts(actor),
  ]);
  return { sales, projects, bidding, finance, charts };
}

export async function getReportCharts(actor: TenantActor) {
  assertCanViewReports(actor);
  const orgId = actor.organizationId;
  const now = new Date();
  const monthsBack = 6;
  const rangeStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsBack - 1), 1),
  );

  const [payments, opportunities, leadGroups, projectGroups, bidRequests, bids] =
    await Promise.all([
      prisma.payment.findMany({
        where: {
          organizationId: orgId,
          status: "SUCCEEDED",
          OR: [
            { paidAt: { gte: rangeStart } },
            { paidAt: null, createdAt: { gte: rangeStart } },
          ],
        },
        select: { amount: true, paidAt: true, createdAt: true },
      }),
      prisma.opportunity.findMany({
        where: { organizationId: orgId, archivedAt: null },
        select: { stage: true, estimatedValue: true },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { organizationId: orgId, archivedAt: null },
        _count: { _all: true },
      }),
      prisma.project.groupBy({
        by: ["status"],
        where: { organizationId: orgId, archivedAt: null },
        _count: { _all: true },
      }),
      prisma.bidRequest.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.bid.groupBy({
        by: ["status"],
        where: {
          organizationId: orgId,
          status: { notIn: ["DRAFT", "WITHDRAWN"] },
        },
        _count: { _all: true },
      }),
    ]);

  const revenue = payments.reduce((sum, row) => sum + toNumber(row.amount), 0);
  // Reuse finance totals for breakdown (full org, not just window).
  const [fullRevenue, resourceCost, expenses] = await Promise.all([
    sumSucceededPayments(orgId),
    sumAcceptedBidAmounts(orgId),
    sumApprovedExpenses(orgId),
  ]);

  const totalRequests = bidRequests.reduce((sum, row) => sum + row._count._all, 0);
  const openRequests =
    bidRequests.find((row) => row.status === "OPEN")?._count._all ?? 0;
  const awardedRequests =
    bidRequests.find((row) => row.status === "AWARDED")?._count._all ?? 0;

  return {
    revenueByMonth: bucketAmountsByMonth(
      payments.map((row) => ({
        at: row.paidAt ?? row.createdAt,
        amount: toNumber(row.amount),
      })),
      monthsBack,
      now,
    ).map((row) => ({
      label: row.label,
      amount: row.amount,
    })),
    pipelineByStage: OPPORTUNITY_STAGES.map((stage) => {
      const rows = opportunities.filter((row) => row.stage === stage);
      return {
        label: humanizeKey(stage),
        count: rows.length,
        value: Number(
          rows
            .reduce((sum, row) => sum + toNumber(row.estimatedValue), 0)
            .toFixed(2),
        ),
      };
    }),
    bidConversion: buildBidConversionSeries({
      totalRequests,
      openRequests,
      awardedRequests,
    }),
    financeBreakdown: buildFinanceBreakdownSeries({
      revenue: fullRevenue,
      resourceCost,
      expenses,
    }),
    leadsByStatus: LEAD_STATUSES.map((status) => ({
      label: humanizeKey(status),
      count: leadGroups.find((row) => row.status === status)?._count._all ?? 0,
    })),
    projectsByStatus: projectGroups.map((row) => ({
      label: humanizeKey(row.status),
      count: row._count._all,
    })),
    bidsByStatus: bids.map((row) => ({
      label: humanizeKey(row.status),
      count: row._count._all,
    })),
    windowRevenue: formatMoney(revenue),
  };
}
