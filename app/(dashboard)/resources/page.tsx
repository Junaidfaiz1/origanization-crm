import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { resourceListFilterSchema } from "@/modules/resources/validation";
import {
  getResourceSummary,
  listResources,
  listSkillOptions,
} from "@/modules/resources/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { ResourcesTable } from "@/components/resources/resources-table";
import {
  ResourceAvailabilityFilter,
  ResourceSkillFilter,
  ResourceSummaryCards,
  ResourceTypeFilter,
} from "@/components/resources/resource-summary";

export const metadata = { title: "Resources" };

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    availabilityStatus?: string;
    skillId?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "RESOURCE_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to resources"
        description="Ask an owner or project manager to grant RESOURCE_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = resourceListFilterSchema.parse({
    search: params.q,
    type: params.type,
    availabilityStatus: params.availabilityStatus,
    skillId: params.skillId,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let skills;
  try {
    [result, summary, skills] = await Promise.all([
      listResources(ctx, filter),
      getResourceSummary(ctx),
      listSkillOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to resources"
          description="Ask an owner or project manager to grant RESOURCE_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load resources"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "RESOURCE_CREATE");
  const selectedSkill = skills.find((skill) => skill.id === params.skillId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Resources"
        description="Employees and freelancers with skills, rates, and availability."
        actions={
          canCreate ? (
            <Button asChild className="shrink-0">
              <Link href="/resources/new">
                <Plus className="h-4 w-4" />
                New resource
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ResourceSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search name, email, bio, or skill" />
        <ResourceTypeFilter />
        <ResourceAvailabilityFilter />
        <ResourceSkillFilter skills={skills} />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {selectedSkill ? (
        <p className="text-sm text-muted-foreground">
          Filtered to skill <span className="font-medium">{selectedSkill.name}</span>
          {" · "}
          <Link href="/resources" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="Create resource profiles for team members and freelancers to assign on projects and bids."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/resources/new">Create resource</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="resources" />
          <ResourcesTable resources={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              type: params.type,
              availabilityStatus: params.availabilityStatus,
              skillId: params.skillId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
