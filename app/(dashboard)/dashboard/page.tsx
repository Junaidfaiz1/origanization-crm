import {
  CircleDollarSign,
  FolderKanban,
  Gavel,
  Receipt,
  FileText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { requireDashboardUser } from "@/lib/auth/page";
import { getDashboardMetrics } from "@/modules/reports/service";

export const metadata = { title: "Dashboard" };

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

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipeline, delivery, and finance at a glance.
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total revenue
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {metrics.canViewFinance && metrics.revenue != null ? (
                <MoneyDisplay amount={metrics.revenue} />
              ) : (
                "—"
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.canViewFinance
                ? "Succeeded payments this workspace"
                : "REPORT_VIEW required"}
            </p>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {metrics.canViewFinance && metrics.profit != null ? (
                <MoneyDisplay amount={metrics.profit} />
              ) : (
                "—"
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {metrics.canViewFinance
                ? `Margin ${metrics.profitMargin ?? "—"}`
                : "REPORT_VIEW required"}
            </p>
          </CardContent>
        </Card>

        <StatCard
          title="Active projects"
          value={String(metrics.activeProjects)}
          hint="Currently in delivery"
          icon={FolderKanban}
        />
        <StatCard
          title="Open bids"
          value={String(metrics.openBids)}
          hint="Bid requests accepting proposals"
          icon={Gavel}
        />
        <StatCard
          title="Pending proposals"
          value={String(metrics.pendingProposals)}
          hint="Awaiting client action"
          icon={FileText}
        />
        <StatCard
          title="Outstanding invoices"
          value={String(metrics.outstandingInvoices)}
          hint="Sent, partial, or overdue"
          icon={Receipt}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Recent projects</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentProjects.length === 0 ? (
              <EmptyState
                title="You're all caught up. Create your first project."
                description="Projects appear here after a proposal is accepted or a manager creates one."
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
                      <p className="text-xs text-muted-foreground">{project.status}</p>
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
                    <p className="text-xs text-muted-foreground">
                      {item.entityType} · {item.createdAt.toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
