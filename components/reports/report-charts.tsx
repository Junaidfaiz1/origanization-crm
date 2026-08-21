"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "hsl(199 72% 36%)",
  "hsl(160 45% 32%)",
  "hsl(28 80% 42%)",
  "hsl(215 16% 42%)",
  "hsl(340 55% 42%)",
  "hsl(250 25% 45%)",
  "hsl(90 35% 36%)",
  "hsl(190 50% 38%)",
];

type MoneyPoint = { label: string; amount: number };
type CountPoint = { label: string; count: number };
type StagePoint = { label: string; count: number; value: number };

function moneyTooltip(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function ChartShell({
  title,
  description,
  children,
  empty,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-h4 tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-caption text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {empty ? (
        <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
          No data yet for this chart.
        </p>
      ) : (
        <div className="h-56 w-full">{children}</div>
      )}
    </div>
  );
}

export function RevenueTrendChart({ data }: { data: MoneyPoint[] }) {
  const empty = data.every((row) => row.amount === 0);
  return (
    <ChartShell
      title="Revenue trend"
      description="Succeeded payments by month (last 6 months)"
      empty={empty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(value) => moneyTooltip(Number(value))} />
          <Line
            type="monotone"
            dataKey="amount"
            name="Revenue"
            stroke={COLORS[0]}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function PipelineValueChart({ data }: { data: StagePoint[] }) {
  const empty = data.every((row) => row.value === 0 && row.count === 0);
  return (
    <ChartShell
      title="Pipeline by stage"
      description="Opportunity value across stages"
      empty={empty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(value) => moneyTooltip(Number(value))} />
          <Bar dataKey="value" name="Value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function BidConversionChart({ data }: { data: CountPoint[] }) {
  const empty = data.every((row) => row.count === 0);
  return (
    <ChartShell
      title="Bid conversion"
      description="Requests → open → awarded"
      empty={empty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
          <Tooltip />
          <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={data[index]!.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function FinanceBreakdownChart({ data }: { data: MoneyPoint[] }) {
  const empty = data.every((row) => row.amount === 0);
  return (
    <ChartShell
      title="Finance mix"
      description="Revenue vs resource cost vs expenses"
      empty={empty}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(value) => moneyTooltip(Number(value))} />
          <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={data[index]!.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function StatusDonutChart({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: CountPoint[];
}) {
  const filtered = data.filter((row) => row.count > 0);
  return (
    <ChartShell title={title} description={description} empty={filtered.length === 0}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="count"
            nameKey="label"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
          >
            {filtered.map((row, index) => (
              <Cell key={row.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export type ReportChartsData = {
  revenueByMonth: MoneyPoint[];
  pipelineByStage: StagePoint[];
  bidConversion: CountPoint[];
  financeBreakdown: MoneyPoint[];
  leadsByStatus: CountPoint[];
  projectsByStatus: CountPoint[];
  bidsByStatus: CountPoint[];
};

export function ReportsChartsGrid({
  charts,
  section,
}: {
  charts: ReportChartsData;
  section: string;
}) {
  const showOverview = section === "overview";
  const showSales = showOverview || section === "sales";
  const showProjects = showOverview || section === "projects";
  const showBidding = showOverview || section === "bidding";
  const showFinance = showOverview || section === "finance";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {showFinance ? <RevenueTrendChart data={charts.revenueByMonth} /> : null}
      {showSales ? <PipelineValueChart data={charts.pipelineByStage} /> : null}
      {showBidding ? <BidConversionChart data={charts.bidConversion} /> : null}
      {showFinance ? (
        <FinanceBreakdownChart data={charts.financeBreakdown} />
      ) : null}
      {showSales ? (
        <StatusDonutChart
          title="Leads by status"
          description="Active lead pipeline mix"
          data={charts.leadsByStatus}
        />
      ) : null}
      {showProjects ? (
        <StatusDonutChart
          title="Projects by status"
          description="Delivery status distribution"
          data={charts.projectsByStatus}
        />
      ) : null}
      {showBidding ? (
        <StatusDonutChart
          title="Bids by status"
          description="Excludes draft and withdrawn"
          data={charts.bidsByStatus}
        />
      ) : null}
    </div>
  );
}
