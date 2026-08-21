import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { fileListFilterSchema } from "@/modules/files/validation";
import {
  getFileSummary,
  listFileProjectOptions,
  listFiles,
} from "@/modules/files/service";
import { isR2StorageConfigured } from "@/lib/storage/storage-service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { FilesTable } from "@/components/files/files-table";
import { FileSummaryCards } from "@/components/files/file-summary";
import { FileProjectFilter } from "@/components/files/file-project-filter";

export const metadata = { title: "Files" };

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    projectId?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to files"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = fileListFilterSchema.parse({
    search: params.q,
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
      listFiles(ctx, filter),
      getFileSummary(ctx, params.projectId),
      listFileProjectOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to files"
          description="Ask an owner or project manager to grant PROJECT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load files"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpload =
    hasPermission(ctx.permissions, "PROJECT_UPDATE") && isR2StorageConfigured();
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Delivery"
        title="Files"
        description="Project attachments stored in Cloudflare R2."
        actions={
          canUpload ? (
            <Button asChild className="shrink-0">
              <Link
                href={
                  params.projectId
                    ? `/files/new?projectId=${params.projectId}`
                    : "/files/new"
                }
              >
                <Plus className="h-4 w-4" />
                Upload file
              </Link>
            </Button>
          ) : undefined
        }
      />

      {!isR2StorageConfigured() ? (
        <ErrorState
          title="R2 storage is not configured"
          description="Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env to enable uploads."
        />
      ) : null}

      <FileSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search file name" />
        <FileProjectFilter projects={projects} />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/files" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No files yet"
          description="Upload briefs, specs, and delivery artifacts to a project."
          action={
            canUpload ? (
              <Button asChild>
                <Link href="/files/new">Upload file</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="files" />
          <FilesTable files={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              projectId: params.projectId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
