import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { milestoneListFilterSchema } from "@/modules/milestones/validation";
import {
  getMilestoneStatusSummary,
  listMilestoneProjectOptions,
  listMilestones,
} from "@/modules/milestones/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { MilestonesTable } from "@/components/milestones/milestones-table";
import {
  MilestoneStatusFilter,
  MilestoneStatusSummary,
} from "@/components/milestones/milestone-status-summary";
import { MilestoneProjectFilter } from "@/components/milestones/milestone-project-filter";

export const metadata = { title: "Milestones" };

export default async function MilestonesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    projectId?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to milestones"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = milestoneListFilterSchema.parse({
    search: params.q,
    status: params.status,
    projectId: params.projectId,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let projects;
  try {
    [result, summary, projects] = await Promise.all([
      listMilestones(ctx, filter),
      getMilestoneStatusSummary(ctx, params.projectId),
      listMilestoneProjectOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to milestones"
          description="Ask an owner or project manager to grant PROJECT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load milestones"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "PROJECT_UPDATE");
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Delivery</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Milestones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Delivery checkpoints and billed amounts per project.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link
              href={
                params.projectId
                  ? `/milestones/new?projectId=${params.projectId}`
                  : "/milestones/new"
              }
            >
              <Plus className="h-4 w-4" />
              New milestone
            </Link>
          </Button>
        ) : null}
      </div>

      <MilestoneStatusSummary summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search milestone or project" />
        <MilestoneStatusFilter />
        <MilestoneProjectFilter projects={projects} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/milestones" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No milestones yet"
          description="Add checkpoints to a project to track delivery and billed amounts."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/milestones/new">Create milestone</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} milestones</p>
          <MilestonesTable milestones={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              projectId: params.projectId,
            }}
          />
        </>
      )}
    </div>
  );
}
