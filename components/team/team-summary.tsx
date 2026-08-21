type TeamSummary = {
  total: number;
  employeeCount: number;
  freelancerCount: number;
};

export function TeamSummaryCards({ summary }: { summary: TeamSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Assignments</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{summary.total}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Employees</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          {summary.employeeCount}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Freelancers</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          {summary.freelancerCount}
        </p>
      </div>
    </div>
  );
}
