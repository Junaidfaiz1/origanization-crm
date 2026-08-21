import { formatGraphQLError } from "@/lib/graphql/errors";
import type { GraphQLContext } from "@/lib/graphql/context";
import { requireAuth, requirePermission } from "@/lib/permissions/guards";
import {
  getBiddingReport,
  getDashboardMetrics,
  getFinanceReport,
  getProjectsReport,
  getReportCharts,
  getReportsOverview,
  getSalesReport,
} from "@/modules/reports/service";

async function run<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw formatGraphQLError(error, requestId);
  }
}

export const reportResolvers = {
  Query: {
    reportsOverview: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "REPORT_VIEW");
        return getReportsOverview(actor);
      }),
    salesReport: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "REPORT_VIEW");
        return getSalesReport(actor);
      }),
    projectsReport: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "REPORT_VIEW");
        return getProjectsReport(actor);
      }),
    biddingReport: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "REPORT_VIEW");
        return getBiddingReport(actor);
      }),
    financeReport: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "REPORT_VIEW");
        return getFinanceReport(actor);
      }),
    reportCharts: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requirePermission(ctx, "REPORT_VIEW");
        return getReportCharts(actor);
      }),
    dashboardMetrics: async (_p: unknown, _args: unknown, ctx: GraphQLContext) =>
      run(ctx.requestId, async () => {
        const actor = requireAuth(ctx);
        const metrics = await getDashboardMetrics(actor);
        return {
          canViewFinance: metrics.canViewFinance,
          revenue: metrics.revenue,
          profit: metrics.profit,
          profitMargin: metrics.profitMargin,
          activeProjects: metrics.activeProjects,
          openBids: metrics.openBids,
          pendingProposals: metrics.pendingProposals,
          outstandingInvoices: metrics.outstandingInvoices,
          overdueInvoices: metrics.overdueInvoices,
          leadsCount: metrics.leadsCount,
          openOpportunities: metrics.openOpportunities,
          pipelineValue: metrics.pipelineValue,
          myOpenTasks: metrics.myOpenTasks,
          upcomingMilestones: metrics.upcomingMilestones,
        };
      }),
  },
};
