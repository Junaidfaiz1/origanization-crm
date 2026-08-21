import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { teamListFilterSchema } from "@/modules/team/validation";
import {
  getTeamSummary,
  listTeamMembers,
  listTeamProjectOptions,
} from "@/modules/team/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { TeamTable } from "@/components/team/team-table";
import { TeamSummaryCards } from "@/components/team/team-summary";
import { TeamProjectFilter, TeamTypeFilter } from "@/components/team/team-filters";

export const metadata = { title: "Team" };

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    projectId?: string;
    type?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to project teams"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = teamListFilterSchema.parse({
    search: params.q,
    projectId: params.projectId,
    type: params.type,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let projects;
  try {
    [result, summary, projects] = await Promise.all([
      listTeamMembers(ctx, filter),
      getTeamSummary(ctx, params.projectId),
      listTeamProjectOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to project teams"
          description="Ask an owner or project manager to grant PROJECT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load team assignments"
        description="Check the database connection and try again."
      />
    );
  }

  const canAssign = hasPermission(ctx.permissions, "PROJECT_UPDATE");
  const showRates = hasPermission(ctx.permissions, "RESOURCE_VIEW");
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Team"
        description="Assign employees and freelancers to projects."
        actions={
          canAssign ? (
            <Button asChild className="shrink-0">
              <Link
                href={
                  params.projectId ? `/team/new?projectId=${params.projectId}` : "/team/new"
                }
              >
                <Plus className="h-4 w-4" />
                Assign member
              </Link>
            </Button>
          ) : undefined
        }
      />

      <TeamSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search member, role, or project" />
        <TeamTypeFilter />
        <TeamProjectFilter projects={projects} />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/team" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No team assignments yet"
          description="Assign a resource profile to a project to start delivery."
          action={
            canAssign ? (
              <Button asChild>
                <Link href="/team/new">Assign member</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="assignments" />
          <TeamTable members={result.nodes} showRates={showRates} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              projectId: params.projectId,
              type: params.type,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
