import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { TaskForm } from "@/components/tasks/task-form";
import {
  getTask,
  listTaskMilestoneOptions,
  listTaskProjectOptions,
} from "@/modules/tasks/service";
import { listAssignableUsers } from "@/modules/leads/service";
import { isProjectClosed } from "@/modules/projects/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit task" };

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "TASK_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit tasks"
        description="Ask an owner or project manager to grant TASK_UPDATE."
      />
    );
  }

  const { id } = await params;

  let task;
  try {
    task = await getTask(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You cannot edit this task"
          description="You can only update tasks assigned to you."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load this task"
        description="Check the database connection and try again."
      />
    );
  }

  const canManageAll =
    hasPermission(ctx.permissions, "TASK_CREATE") ||
    hasPermission(ctx.permissions, "TASK_DELETE");
  const isAssignee = task.assignedToId === ctx.userId;
  if (!canManageAll && !isAssignee) {
    return (
      <ErrorState
        title="You cannot edit this task"
        description="You can only update tasks assigned to you."
      />
    );
  }

  const projectOpen = !isProjectClosed(task.project.status);
  if (!projectOpen) {
    return (
      <ErrorState
        title="Project is closed"
        description="Tasks on closed projects cannot be edited. Change status from the detail page if needed."
      />
    );
  }

  const [projects, milestones, assignees] = await Promise.all([
    listTaskProjectOptions(ctx),
    listTaskMilestoneOptions(ctx, task.projectId),
    listAssignableUsers(ctx.organizationId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/tasks/${task.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {task.title}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Edit task</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Task details</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            task={task}
            projects={projects}
            milestones={milestones}
            assignees={assignees}
            canEditProject={canManageAll}
          />
        </CardContent>
      </Card>
    </div>
  );
}
