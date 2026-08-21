import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { contractListFilterSchema } from "@/modules/contracts/validation";
import {
  getContractSummary,
  listContractProjectOptions,
  listContracts,
} from "@/modules/contracts/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { ContractsTable } from "@/components/contracts/contracts-table";
import {
  ContractProjectFilter,
  ContractStatusFilter,
  ContractSummaryCards,
} from "@/components/contracts/contract-summary";

export const metadata = { title: "Contracts" };

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    projectId?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "CONTRACT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to contracts"
        description="Ask a project manager to grant CONTRACT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = contractListFilterSchema.parse({
    search: params.q,
    status: params.status,
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
      listContracts(ctx, filter),
      getContractSummary(ctx, params.projectId),
      listContractProjectOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to contracts"
          description="Ask a project manager to grant CONTRACT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load contracts"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "CONTRACT_CREATE");
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Contracts"
        description="Draft and track agreements linked to projects, resources, and awarded bids."
        actions={
          canCreate ? (
            <Button asChild className="shrink-0">
              <Link
                href={
                  params.projectId
                    ? `/contracts/new?projectId=${params.projectId}`
                    : "/contracts/new"
                }
              >
                <Plus className="h-4 w-4" />
                New contract
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ContractSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search title, project, client, or resource" />
        <ContractStatusFilter />
        <ContractProjectFilter projects={projects} />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/contracts" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No contracts yet"
          description="Create a contract after awarding a bid or when formalizing project terms."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/contracts/new">Create contract</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="contracts" />
          <ContractsTable contracts={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              projectId: params.projectId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
