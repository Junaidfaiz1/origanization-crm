import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { timeEntryListFilterSchema } from "@/modules/time-tracking/validation";
import {
  getActiveTimeEntry,
  getTimeEntrySummary,
  listTimeEntries,
  listTimeEntryProjectOptions,
  listTimeEntryTaskOptions,
  listTimeEntryUserOptions,
} from "@/modules/time-tracking/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { TimeEntriesTable } from "@/components/time-tracking/time-entries-table";
import { ActiveTimerPanel } from "@/components/time-tracking/active-timer-panel";
import {
  TimeEntryBillableFilter,
  TimeEntryProjectFilter,
  TimeEntrySummaryCards,
  TimeEntryUserFilter,
} from "@/components/time-tracking/time-entry-summary";

export const metadata = { title: "Time tracking" };

export default async function TimeTrackingPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    projectId?: string;
    userId?: string;
    billable?: string;
    runningOnly?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "TIME_ENTRY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to time tracking"
        description="Ask an owner or project manager to grant TIME_ENTRY_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = timeEntryListFilterSchema.parse({
    search: params.q,
    projectId: params.projectId,
    userId: params.userId,
    billable: params.billable,
    runningOnly: params.runningOnly,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let projects;
  let tasks;
  let users;
  let activeEntry;
  try {
    [result, summary, projects, tasks, users, activeEntry] = await Promise.all([
      listTimeEntries(ctx, filter),
      getTimeEntrySummary(ctx, params.projectId),
      listTimeEntryProjectOptions(ctx),
      listTimeEntryTaskOptions(ctx),
      listTimeEntryUserOptions(ctx),
      getActiveTimeEntry(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to time tracking"
          description="Ask an owner or project manager to grant TIME_ENTRY_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load time entries"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "TIME_ENTRY_CREATE");
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Time tracking"
        description="Log billable hours with server-validated durations."
        actions={
          canCreate ? (
            <Button asChild className="shrink-0">
              <Link
                href={
                  params.projectId
                    ? `/time-tracking/new?projectId=${params.projectId}`
                    : "/time-tracking/new"
                }
              >
                <Plus className="h-4 w-4" />
                Log time
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ActiveTimerPanel
        activeEntry={activeEntry}
        projects={projects}
        tasks={tasks}
        canCreate={canCreate}
      />

      <TimeEntrySummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search project, task, person, or notes" />
        <TimeEntryProjectFilter projects={projects} />
        <TimeEntryUserFilter users={users} />
        <TimeEntryBillableFilter />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/time-tracking" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No time logged yet"
          description="Start a timer or log a completed entry on an active project."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/time-tracking/new">Log time</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="entries" />
          <TimeEntriesTable entries={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              projectId: params.projectId,
              userId: params.userId,
              billable: params.billable,
              runningOnly: params.runningOnly,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
