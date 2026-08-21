import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDetailActions } from "@/components/tasks/task-detail-actions";
import { getTask } from "@/modules/tasks/service";
import { isProjectClosed } from "@/modules/projects/rules";

export const metadata = { title: "Task" };

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
          title="You cannot view this task"
          description="You can only open tasks assigned to you."
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

  const projectOpen = !isProjectClosed(task.project.status);
  const canManageAll =
    hasPermission(ctx.permissions, "TASK_CREATE") ||
    hasPermission(ctx.permissions, "TASK_DELETE");
  const isAssignee = task.assignedToId === ctx.userId;
  const canUpdate =
    hasPermission(ctx.permissions, "TASK_UPDATE") &&
    projectOpen &&
    (canManageAll || isAssignee);
  const canDelete = hasPermission(ctx.permissions, "TASK_DELETE") && projectOpen;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
            ← Tasks
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{task.title}</h1>
            <StatusBadge status={task.status} />
            <StatusBadge status={task.priority} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${task.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {task.project.name}
            </Link>
            {task.milestone ? (
              <>
                {" · "}
                <Link
                  href={`/milestones/${task.milestone.id}`}
                  className="hover:text-foreground hover:underline"
                >
                  {task.milestone.name}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <TaskDetailActions
          taskId={task.id}
          currentStatus={task.status}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Assignee" value={task.assignedTo?.name ?? "Unassigned"} />
            <Field label="Due date">
              {task.dueDate ? <DateDisplay value={task.dueDate} /> : "—"}
            </Field>
            <Field label="Estimated hours" value={task.estimatedHours ?? "—"} />
            <Field label="Actual hours" value={task.actualHours ?? "—"} />
            <Field label="Created">
              <DateDisplay value={task.createdAt} />
            </Field>
            <Field label="Updated">
              <DateDisplay value={task.updatedAt} />
            </Field>
            <Field label="Description" value={task.description} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={task.project.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{task.project.clientName}</span>
            </div>
            {!projectOpen ? (
              <p className="text-xs text-muted-foreground">
                This project is closed. Task edits are limited to status history only.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children ?? value ?? "—"}</div>
    </div>
  );
}
