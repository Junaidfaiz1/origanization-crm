import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { taskListFilterSchema } from "@/modules/tasks/validation";
import {
  getTaskStatusSummary,
  listTaskProjectOptions,
  listTasks,
  listTasksForKanban,
} from "@/modules/tasks/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { TasksTable } from "@/components/tasks/tasks-table";
import { TaskKanbanBoard } from "@/components/tasks/task-kanban-board";
import { TaskProjectFilter } from "@/components/tasks/task-project-filter";
import {
  TaskPriorityFilter,
  TaskStatusFilter,
  TaskStatusSummary,
  TaskViewToggle,
} from "@/components/tasks/task-status-summary";

export const metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    view?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "TASK_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to tasks"
        description="Ask an owner or project manager to grant TASK_VIEW."
      />
    );
  }

  const params = await searchParams;
  const isKanban = params.view === "kanban";
  const filter = taskListFilterSchema.parse({
    search: params.q,
    status: params.status,
    priority: params.priority,
    projectId: params.projectId,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let kanban;
  let summary;
  let projects;
  try {
    [result, summary, projects] = await Promise.all([
      isKanban ? Promise.resolve(null) : listTasks(ctx, filter),
      getTaskStatusSummary(ctx, params.projectId),
      listTaskProjectOptions(ctx),
    ]);
    if (isKanban) {
      kanban = await listTasksForKanban(ctx, filter);
    }
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to tasks"
          description="Ask an owner or project manager to grant TASK_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load tasks"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "TASK_CREATE");
  const canUpdate = hasPermission(ctx.permissions, "TASK_UPDATE");
  const selectedProject = projects.find((project) => project.id === params.projectId);
  const totalCount = isKanban ? (kanban?.totalCount ?? 0) : (result?.totalCount ?? 0);
  const isEmpty = isKanban ? (kanban?.totalCount ?? 0) === 0 : (result?.nodes.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Delivery</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Work items assigned to your team and external resources.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <TaskViewToggle />
          {canCreate ? (
            <Button asChild>
              <Link
                href={
                  params.projectId
                    ? `/tasks/new?projectId=${params.projectId}`
                    : "/tasks/new"
                }
              >
                <Plus className="h-4 w-4" />
                New task
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <TaskStatusSummary summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search task, project, or assignee" />
        <TaskStatusFilter />
        <TaskPriorityFilter />
        <TaskProjectFilter projects={projects} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/tasks" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="No tasks yet"
          description="Create tasks on active projects to track delivery work."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/tasks/new">Create task</Link>
              </Button>
            ) : undefined
          }
        />
      ) : isKanban && kanban ? (
        <>
          <p className="text-sm text-muted-foreground">{totalCount} tasks on board</p>
          <TaskKanbanBoard board={kanban} canUpdate={canUpdate} />
        </>
      ) : result ? (
        <>
          <p className="text-sm text-muted-foreground">{totalCount} tasks</p>
          <TasksTable tasks={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              priority: params.priority,
              projectId: params.projectId,
              view: params.view,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
