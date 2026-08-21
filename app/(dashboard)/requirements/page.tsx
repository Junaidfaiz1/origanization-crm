import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { requirementListFilterSchema } from "@/modules/requirements/validation";
import {
  getRequirementStatusSummary,
  listRequirementProjectOptions,
  listRequirements,
} from "@/modules/requirements/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { RequirementsTable } from "@/components/requirements/requirements-table";
import {
  RequirementPriorityFilter,
  RequirementStatusFilter,
  RequirementStatusSummary,
} from "@/components/requirements/requirement-status-summary";
import { RequirementProjectFilter } from "@/components/requirements/requirement-project-filter";

export const metadata = { title: "Requirements" };

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to requirements"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = requirementListFilterSchema.parse({
    search: params.q,
    status: params.status,
    priority: params.priority,
    projectId: params.projectId,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let projects;
  try {
    [result, summary, projects] = await Promise.all([
      listRequirements(ctx, filter),
      getRequirementStatusSummary(ctx, params.projectId),
      listRequirementProjectOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to requirements"
          description="Ask an owner or project manager to grant PROJECT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load requirements"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "PROJECT_UPDATE");
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Requirements"
        description="Scoped project needs with priority and status tracking."
        actions={
          canCreate ? (
            <Button asChild className="shrink-0">
              <Link
                href={
                  params.projectId
                    ? `/requirements/new?projectId=${params.projectId}`
                    : "/requirements/new"
                }
              >
                <Plus className="h-4 w-4" />
                New requirement
              </Link>
            </Button>
          ) : undefined
        }
      />

      <RequirementStatusSummary summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search requirement or project" />
        <RequirementStatusFilter />
        <RequirementPriorityFilter />
        <RequirementProjectFilter projects={projects} />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/requirements" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No requirements yet"
          description="Capture project needs so delivery and bidding stay aligned."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/requirements/new">Create requirement</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="requirements" />
          <RequirementsTable requirements={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              priority: params.priority,
              projectId: params.projectId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
