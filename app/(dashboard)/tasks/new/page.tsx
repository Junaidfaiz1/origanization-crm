import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { TaskForm } from "@/components/tasks/task-form";
import {
  listTaskMilestoneOptions,
  listTaskProjectOptions,
} from "@/modules/tasks/service";
import { listAssignableUsers } from "@/modules/leads/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New task" };

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "TASK_CREATE")) {
    return (
      <ErrorState
        title="You cannot create tasks"
        description="Ask an owner or project manager to grant TASK_CREATE."
      />
    );
  }

  const params = await searchParams;
  const [projects, milestones, assignees] = await Promise.all([
    listTaskProjectOptions(ctx),
    listTaskMilestoneOptions(ctx, params.projectId),
    listAssignableUsers(ctx.organizationId),
  ]);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a project first"
          description="Tasks must belong to an active, open project."
        />
        <p className="text-center text-sm">
          <Link href="/projects/new" className="font-medium hover:underline">
            Create project
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
          ← Tasks
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Create task</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Task details</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            projects={projects}
            milestones={milestones}
            assignees={assignees}
            defaultProjectId={params.projectId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
