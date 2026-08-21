import Link from "next/link";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { activityListFilterSchema } from "@/modules/activity/validation";
import {
  listActivity,
  listActivityProjectOptions,
} from "@/modules/activity/service";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ActivityFeed } from "@/components/activity/activity-feed";
import {
  ActivityEntityFilter,
  ActivityProjectFilter,
} from "@/components/activity/activity-filters";

export const metadata = { title: "Activity" };

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    projectId?: string;
    entityType?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to activity"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = activityListFilterSchema.parse({
    search: params.q,
    projectId: params.projectId,
    entityType: params.entityType,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let projects;
  try {
    [result, projects] = await Promise.all([
      listActivity(ctx, filter),
      listActivityProjectOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to activity"
          description="Ask an owner or project manager to grant PROJECT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load activity"
        description="Check the database connection and try again."
      />
    );
  }

  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Delivery</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Audited delivery events across projects, tasks, bids, and finance linked to work.
        </p>
      </div>

      <FilterBar>
        <SearchInput placeholder="Search action or person" />
        <ActivityEntityFilter />
        <ActivityProjectFilter projects={projects} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/activity" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No activity yet"
          description="Create or update a project, task, bid, or invoice to start the audit trail."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} events</p>
          <ActivityFeed items={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              projectId: params.projectId,
              entityType: params.entityType,
            }}
          />
        </>
      )}
    </div>
  );
}
