import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFreelancerUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { getFreelancerTask } from "@/modules/freelancer-portal/service";
import { FreelancerTaskStatusSelect } from "@/components/freelancer/freelancer-task-status";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Task" };

export default async function FreelancerTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireFreelancerUser();
  if (!hasPermission(ctx.permissions, "TASK_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to tasks"
        description="Ask the agency to grant TASK_VIEW."
      />
    );
  }

  const { id } = await params;

  let task;
  try {
    task = await getFreelancerTask(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this task"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpdate = hasPermission(ctx.permissions, "TASK_UPDATE");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/freelancer/tasks"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← My tasks
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {task.title}
            </h1>
            <StatusBadge status={task.status} />
            <StatusBadge status={task.priority} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{task.project.name}</p>
        </div>
        <FreelancerTaskStatusSelect
          taskId={task.id}
          currentStatus={task.status}
          canUpdate={canUpdate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {task.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">{task.description}</p>
          ) : (
            <p className="text-muted-foreground">No description.</p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Due: </span>
              {task.dueDate ? <DateDisplay value={task.dueDate} /> : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Estimated hours: </span>
              {task.estimatedHours ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
