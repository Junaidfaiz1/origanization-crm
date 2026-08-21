import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { progressListFilterSchema } from "@/modules/progress/validation";
import {
  getProgressOverview,
  listProjectProgress,
} from "@/modules/progress/service";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { SearchInput } from "@/components/shared/search-input";
import { FilterBar } from "@/components/shared/filter-bar";
import { Pagination } from "@/components/shared/pagination";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { ProgressTable } from "@/components/progress/progress-table";
import { ProgressHealthFilter } from "@/components/progress/progress-health-filter";

export const metadata = { title: "Project progress" };

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; health?: string; sort?: string; cursor?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to project progress"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = progressListFilterSchema.parse({
    search: params.q,
    health: params.health,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let overview;
  try {
    [result, overview] = await Promise.all([
      listProjectProgress(ctx, filter),
      getProgressOverview(ctx),
    ]);
  } catch {
    return (
      <ErrorState
        title="Could not load project progress"
        description="Check the database connection and try again."
      />
    );
  }

  const rows = result.edges.map((edge) => edge.node);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Project progress"
        description="Milestone and task completion, schedule health, and hours vs estimate."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Average complete"
          value={`${Math.round(overview.averagePercent)}%`}
        />
        <Metric label="On track" value={String(overview.onTrack)} />
        <Metric label="At risk" value={String(overview.atRisk)} />
        <Metric label="Delayed" value={String(overview.delayed)} />
      </div>

      <FilterBar>
        <SearchInput placeholder="Search projects" />
        <ProgressHealthFilter />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          title="No projects to track"
          description="Create a project and add milestones or tasks to see progress."
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="projects" />
          <ProgressTable rows={rows} />
        </>
      )}

      <Pagination
        hasNextPage={result.pageInfo.hasNextPage}
        endCursor={result.pageInfo.endCursor}
        currentQuery={{ q: params.q, health: params.health, sort: params.sort }}
      />

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {result.totalCount}.{" "}
        <Link href="/projects" className="hover:underline">
          Open projects
        </Link>
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
    </div>
  );
}
