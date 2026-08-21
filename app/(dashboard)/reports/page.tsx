import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getReportsOverview } from "@/modules/reports/service";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "REPORT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to reports"
        description="Ask an owner to grant REPORT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const section = params.section ?? "overview";

  let overview;
  try {
    overview = await getReportsOverview(ctx);
  } catch {
    return (
      <ErrorState
        title="Could not load reports"
        description="Check the database connection and try again."
      />
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "sales", label: "Sales" },
    { id: "projects", label: "Projects" },
    { id: "bidding", label: "Bidding" },
    { id: "finance", label: "Finance" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sales, delivery, bidding, and finance metrics for this organization.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.id === "overview" ? "/reports" : `/reports?section=${tab.id}`}
            className={
              section === tab.id
                ? "rounded-md bg-muted px-3 py-1.5 text-sm font-medium"
                : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {section === "overview" || section === "finance" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Revenue"
            value={<MoneyDisplay amount={overview.finance.revenue} />}
          />
          <Metric
            label="Profit"
            value={<MoneyDisplay amount={overview.finance.profit} />}
          />
          <Metric label="Margin" value={overview.finance.profitMargin} />
          <Metric
            label="Outstanding"
            value={<MoneyDisplay amount={overview.finance.outstandingDue} />}
          />
        </div>
      ) : null}

      {(section === "overview" || section === "sales") && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sales — leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Total {overview.sales.leads.total} · Converted{" "}
                {overview.sales.leads.converted} · Conversion{" "}
                {overview.sales.leads.conversionRate
                  ? `${overview.sales.leads.conversionRate}%`
                  : "—"}
              </p>
              <StatusGrid items={overview.sales.leads.byStatus} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sales — pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Open {overview.sales.pipeline.openCount} · Won{" "}
                {overview.sales.pipeline.wonCount} · Win rate{" "}
                {overview.sales.pipeline.winRate
                  ? `${overview.sales.pipeline.winRate}%`
                  : "—"}
              </p>
              <p className="text-muted-foreground">
                Pipeline{" "}
                <MoneyDisplay amount={overview.sales.pipeline.pipelineValue} /> · Weighted{" "}
                <MoneyDisplay amount={overview.sales.pipeline.weightedValue} />
              </p>
              <ul className="space-y-1">
                {overview.sales.pipeline.stages.map((stage) => (
                  <li key={stage.stage} className="flex justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <StatusBadge status={stage.stage} />
                      <span className="text-muted-foreground">{stage.count}</span>
                    </span>
                    <MoneyDisplay amount={stage.value} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {(section === "overview" || section === "projects") && (
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Active" value={String(overview.projects.active)} />
              <Metric label="Completed" value={String(overview.projects.completed)} />
              <Metric label="Delayed" value={String(overview.projects.delayed)} />
              <Metric
                label="Budget total"
                value={<MoneyDisplay amount={overview.projects.budgetTotal} />}
              />
            </div>
            {overview.projects.delayedProjects.length === 0 ? (
              <EmptyState
                title="No delayed projects"
                description="Active projects past their end date will appear here."
                className="border-0 bg-transparent py-6"
              />
            ) : (
              <ul className="divide-y divide-border">
                {overview.projects.delayedProjects.map((project) => (
                  <li
                    key={project.id}
                    className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:underline"
                    >
                      {project.name}
                    </Link>
                    <p className="text-muted-foreground">
                      <StatusBadge status={project.status} />
                      {project.endDate ? (
                        <>
                          {" · Due "}
                          <DateDisplay value={project.endDate} />
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {(section === "overview" || section === "bidding") && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bidding — requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Total {overview.bidding.requests.total} · Open{" "}
                {overview.bidding.requests.open} · Awarded{" "}
                {overview.bidding.requests.awarded} · Conversion{" "}
                {overview.bidding.requests.conversionRate
                  ? `${overview.bidding.requests.conversionRate}%`
                  : "—"}
              </p>
              <StatusGrid items={overview.bidding.requests.byStatus} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bidding — bids</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Total {overview.bidding.bids.total} · Accepted{" "}
                {overview.bidding.bids.accepted} · Rejected{" "}
                {overview.bidding.bids.rejected}
              </p>
              <p className="text-muted-foreground">
                Avg amount{" "}
                <MoneyDisplay amount={overview.bidding.bids.averageAmount} /> · Avg days{" "}
                {overview.bidding.bids.averageDays || "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {(section === "overview" || section === "finance") && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Finance breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="Revenue"
                value={<MoneyDisplay amount={overview.finance.revenue} />}
              />
              <Row
                label="Resource cost"
                value={<MoneyDisplay amount={overview.finance.resourceCost} />}
              />
              <Row
                label="Expenses"
                value={<MoneyDisplay amount={overview.finance.expenses} />}
              />
              <Row
                label="Payment fees"
                value={<MoneyDisplay amount={overview.finance.paymentFees} />}
              />
              <Row
                label="Profit"
                value={<MoneyDisplay amount={overview.finance.profit} />}
              />
              <Row label="Margin" value={overview.finance.profitMargin} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Invoices & payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium">Invoices</p>
                {overview.finance.invoices.length === 0 ? (
                  <p className="text-muted-foreground">No invoices yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {overview.finance.invoices.map((row) => (
                      <li key={row.status} className="flex justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <StatusBadge status={row.status} />
                          <span className="text-muted-foreground">{row.count}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Due <MoneyDisplay amount={row.amountDue} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="mb-1 font-medium">Payments</p>
                {overview.finance.payments.length === 0 ? (
                  <p className="text-muted-foreground">No payments yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {overview.finance.payments.map((row) => (
                      <li key={row.status} className="flex justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <StatusBadge status={row.status} />
                          <span className="text-muted-foreground">{row.count}</span>
                        </span>
                        <MoneyDisplay amount={row.amount} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatusGrid({ items }: { items: Array<{ status: string; count: number }> }) {
  return (
    <ul className="grid gap-1 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.status} className="flex items-center justify-between gap-2">
          <StatusBadge status={item.status} />
          <span className="tabular-nums text-muted-foreground">{item.count}</span>
        </li>
      ))}
    </ul>
  );
}
