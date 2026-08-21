import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { projectListFilterSchema } from "@/modules/projects/validation";
import {
  getProjectStatusSummary,
  listProjectClientOptions,
  listProjects,
} from "@/modules/projects/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { ProjectsTable } from "@/components/projects/projects-table";
import {
  ProjectStatusFilter,
  ProjectStatusSummary,
} from "@/components/projects/project-status-summary";
import { ProjectClientFilter } from "@/components/projects/project-client-filter";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    clientId?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to projects"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = projectListFilterSchema.parse({
    search: params.q,
    status: params.status,
    clientId: params.clientId,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let clients;
  try {
    [result, summary, clients] = await Promise.all([
      listProjects(ctx, filter),
      getProjectStatusSummary(ctx),
      listProjectClientOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to projects"
          description="Ask an owner or project manager to grant PROJECT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load projects"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "PROJECT_CREATE");
  const selectedClient = clients.find((client) => client.id === params.clientId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Projects"
        description="Client work from planning through delivery, bidding, and completion."
        actions={
          canCreate ? (
            <Button asChild className="shrink-0">
              <Link
                href={
                  params.clientId
                    ? `/projects/new?clientId=${params.clientId}`
                    : "/projects/new"
                }
              >
                <Plus className="h-4 w-4" />
                New project
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ProjectStatusSummary summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search project, client, or manager" />
        <ProjectStatusFilter />
        <ProjectClientFilter clients={clients} />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {selectedClient ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/clients/${selectedClient.id}`} className="font-medium hover:underline">
            {selectedClient.company.name}
          </Link>
          {" · "}
          <Link href="/projects" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project manually or accept a proposal to start delivery."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/projects/new">Create project</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="projects" />
          <ProjectsTable projects={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              clientId: params.clientId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
