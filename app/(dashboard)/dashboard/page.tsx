import {
  Briefcase,
  CircleDollarSign,
  ClipboardList,
  Contact,
  FileText,
  FolderKanban,
  Gavel,
  ListTodo,
  Receipt,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireDashboardUser } from "@/lib/auth/page";
import { getDashboardMetrics, getReportCharts } from "@/modules/reports/service";
import {
  PipelineValueChart,
  RevenueTrendChart,
} from "@/components/reports/report-charts";

export const metadata = { title: "Dashboard" };

function greetingForHour(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function roleBlurb(roleKey: string | null | undefined) {
  switch (roleKey) {
    case "SALES_MANAGER":
      return "Pipeline, leads, and proposals that need attention.";
    case "PROJECT_MANAGER":
      return "Delivery health, open bids, and upcoming milestones.";
    case "FINANCE_MANAGER":
      return "Revenue, outstanding invoices, and cash collection.";
    case "EMPLOYEE":
      return "Your assigned work and active projects.";
    case "ADMIN":
      return "Organization overview across CRM, delivery, and finance.";
    default:
      return "Here's what's happening across your workspace.";
  }
}

export default async function DashboardPage() {
  const ctx = await requireDashboardUser();

  let metrics;
  try {
    metrics = await getDashboardMetrics(ctx);
  } catch {
    return (
      <ErrorState
        title="Dashboard is unavailable"
        description="We could not load organization metrics. Check the database connection and try again."
      />
    );
  }

  let charts: Awaited<ReturnType<typeof getReportCharts>> | null = null;
  if (metrics.canViewFinance) {
    try {
      charts = await getReportCharts(ctx);
    } catch {
      charts = null;
    }
  }

  const firstName = ctx.user.name.split(/\s+/)[0] ?? ctx.user.name;
  const roleKey = metrics.roleKey ?? ctx.roleKey;

  type Kpi = {
    key: string;
    title: string;
    value: React.ReactNode;
    hint?: string;
    icon: typeof FolderKanban;
    href?: string;
  };

  const kpis: Kpi[] = [];

  const pushFinance = () => {
    if (!metrics.canViewFinance) return;
    kpis.push(
      {
        key: "revenue",
        title: "Revenue",
        value: metrics.revenue ? <MoneyDisplay amount={metrics.revenue} /> : "—",
        hint: "Succeeded payments",
        icon: CircleDollarSign,
        href: "/reports",
      },
      {
        key: "profit",
        title: "Profit",
        value: metrics.profit ? <MoneyDisplay amount={metrics.profit} /> : "—",
        hint: metrics.profitMargin
          ? `Margin ${metrics.profitMargin}`
          : "Margin unavailable",
        icon: TrendingUp,
        href: "/reports",
      },
    );
  };

  if (roleKey === "SALES_MANAGER") {
    if (metrics.canViewLeads) {
      kpis.push({
        key: "leads",
        title: "Leads",
        value: String(metrics.leadsCount ?? 0),
        hint: "Active lead records",
        icon: Contact,
        href: "/leads",
      });
    }
    if (metrics.canViewOpportunities) {
      kpis.push({
        key: "opps",
        title: "Open deals",
        value: String(metrics.openOpportunities ?? 0),
        hint: metrics.pipelineValue
          ? `Pipeline $${metrics.pipelineValue}`
          : "Open opportunities",
        icon: Briefcase,
        href: "/opportunities",
      });
    }
    if (metrics.canViewProposals) {
      kpis.push({
        key: "proposals",
        title: "Pending proposals",
        value: String(metrics.pendingProposals ?? 0),
        hint: "Awaiting client action",
        icon: FileText,
        href: "/proposals",
      });
    }
    pushFinance();
  } else if (roleKey === "PROJECT_MANAGER") {
    if (metrics.canViewProjects) {
      kpis.push({
        key: "projects",
        title: "Active projects",
        value: String(metrics.activeProjects ?? 0),
        hint: "In delivery",
        icon: FolderKanban,
        href: "/projects",
      });
    }
    if (metrics.canViewBids) {
      kpis.push({
        key: "bids",
        title: "Open bid requests",
        value: String(metrics.openBids ?? 0),
        hint: "Accepting proposals",
        icon: Gavel,
        href: "/bidding",
      });
    }
    if (metrics.canViewTasks) {
      kpis.push({
        key: "tasks",
        title: "My open tasks",
        value: String(metrics.myOpenTasks ?? 0),
        hint: "Assigned to you",
        icon: ListTodo,
        href: "/tasks",
      });
    }
    if (metrics.canViewProjects) {
      kpis.push({
        key: "milestones",
        title: "Upcoming milestones",
        value: String(metrics.upcomingMilestones ?? 0),
        hint: "Due in 14 days",
        icon: ClipboardList,
        href: "/milestones",
      });
    }
  } else if (roleKey === "FINANCE_MANAGER") {
    pushFinance();
    if (metrics.canViewInvoices) {
      kpis.push(
        {
          key: "outstanding",
          title: "Outstanding invoices",
          value: String(metrics.outstandingInvoices ?? 0),
          hint: "Sent, partial, or overdue",
          icon: Receipt,
          href: "/invoices",
        },
        {
          key: "overdue",
          title: "Overdue",
          value: String(metrics.overdueInvoices ?? 0),
          hint: "Need collection",
          icon: Receipt,
          href: "/invoices?status=OVERDUE",
        },
      );
    }
  } else if (roleKey === "EMPLOYEE") {
    if (metrics.canViewTasks) {
      kpis.push({
        key: "tasks",
        title: "My open tasks",
        value: String(metrics.myOpenTasks ?? 0),
        hint: "Assigned to you",
        icon: ListTodo,
        href: "/tasks",
      });
    }
    if (metrics.canViewProjects) {
      kpis.push({
        key: "projects",
        title: "Active projects",
        value: String(metrics.activeProjects ?? 0),
        hint: "Workspace delivery",
        icon: FolderKanban,
        href: "/projects",
      });
    }
  } else {
    // OWNER / ADMIN / default
    pushFinance();
    if (metrics.canViewProjects) {
      kpis.push({
        key: "projects",
        title: "Active projects",
        value: String(metrics.activeProjects ?? 0),
        hint: "In delivery",
        icon: FolderKanban,
        href: "/projects",
      });
    }
    if (metrics.canViewOpportunities) {
      kpis.push({
        key: "opps",
        title: "Open deals",
        value: String(metrics.openOpportunities ?? 0),
        hint: metrics.pipelineValue
          ? `Pipeline $${metrics.pipelineValue}`
          : "Open opportunities",
        icon: Briefcase,
        href: "/opportunities",
      });
    }
    if (metrics.canViewProposals) {
      kpis.push({
        key: "proposals",
        title: "Pending proposals",
        value: String(metrics.pendingProposals ?? 0),
        hint: "Awaiting client action",
        icon: FileText,
        href: "/proposals",
      });
    }
    if (metrics.canViewInvoices) {
      kpis.push({
        key: "invoices",
        title: "Outstanding invoices",
        value: String(metrics.outstandingInvoices ?? 0),
        hint: "Sent, partial, or overdue",
        icon: Receipt,
        href: "/invoices",
      });
    }
    if (metrics.canViewBids) {
      kpis.push({
        key: "bids",
        title: "Open bids",
        value: String(metrics.openBids ?? 0),
        hint: "Bid requests open",
        icon: Gavel,
        href: "/bidding",
      });
    }
  }

  return (
    <PageContainer className="space-y-8">
      <div className="min-w-0">
        <h1 className="text-h1">
          {greetingForHour()}, {firstName}
        </h1>
        <p className="mt-1 max-w-2xl text-body text-muted-foreground">
          {roleBlurb(roleKey)}
          {metrics.canViewFinance ? (
            <>
              {" "}
              <Link href="/reports" className="text-primary hover:underline">
                Open reports
              </Link>
            </>
          ) : null}
        </p>
      </div>

      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {kpis.slice(0, 6).map((kpi) => (
            <MetricCard
              key={kpi.key}
              title={kpi.title}
              value={kpi.value}
              hint={kpi.hint}
              icon={kpi.icon}
              href={kpi.href}
            />
          ))}
        </div>
      ) : null}

      {charts ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <RevenueTrendChart data={charts.revenueByMonth} />
          <PipelineValueChart data={charts.pipelineByStage} />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {metrics.canViewProjects ? (
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent projects</CardTitle>
              <Link
                href="/projects"
                className="text-caption text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {metrics.recentProjects.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  description="Projects appear after a proposal is accepted or a manager creates one."
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <ul className="divide-y divide-border">
                  {metrics.recentProjects.map((project) => (
                    <li
                      key={project.id}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/projects/${project.id}`}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {project.name}
                        </Link>
                        <div className="mt-1">
                          <StatusBadge status={project.status} />
                        </div>
                      </div>
                      <MoneyDisplay
                        amount={project.budget}
                        className="shrink-0 text-sm"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}

        {metrics.canViewTasks && metrics.myTaskItems.length > 0 ? (
          <Card className="min-w-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My tasks</CardTitle>
              <Link
                href="/tasks"
                className="text-caption text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {metrics.myTaskItems.map((task) => (
                  <li key={task.id} className="flex flex-col gap-1 py-3">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {task.title}
                    </Link>
                    <p className="text-caption text-muted-foreground">
                      {task.projectName}
                      {task.dueDate
                        ? ` · Due ${task.dueDate.toLocaleDateString()}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card className="min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.recentActivity.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Audited actions across this organization will show up here."
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <ul className="space-y-3">
                  {metrics.recentActivity.map((item) => (
                    <li key={item.id} className="min-w-0 text-sm">
                      <p className="break-words font-medium">{item.action}</p>
                      <p className="text-caption text-muted-foreground">
                        {item.entityType} · {item.createdAt.toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {metrics.canViewProjects && metrics.upcomingMilestoneItems.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming milestones</CardTitle>
            <Link
              href="/milestones"
              className="text-caption text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {metrics.upcomingMilestoneItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {item.projectName}
                    </p>
                  </div>
                  <p className="text-caption text-muted-foreground">
                    {item.dueDate ? item.dueDate.toLocaleDateString() : "—"}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
