import Link from "next/link";
import { requireFreelancerUser } from "@/lib/auth/page";
import { listFreelancerTasks } from "@/modules/freelancer-portal/service";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "My tasks" };

export default async function FreelancerTasksPage() {
  const ctx = await requireFreelancerUser();

  let tasks;
  try {
    tasks = await listFreelancerTasks(ctx);
  } catch {
    return (
      <ErrorState
        title="Could not load tasks"
        description="You may be missing TASK_VIEW, or the service is unavailable."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">My tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tasks assigned to you. Other people’s work is hidden.
        </p>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No assigned tasks"
          description="When a project manager assigns work to you, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/freelancer/tasks/${task.id}`}
                      className="font-medium hover:underline"
                    >
                      {task.title}
                    </Link>
                    <StatusBadge status={task.status} />
                    <StatusBadge status={task.priority} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.project.name}
                    {task.dueDate ? (
                      <>
                        {" · Due "}
                        <DateDisplay value={task.dueDate} />
                      </>
                    ) : null}
                  </p>
                </div>
                <Link
                  href={`/freelancer/tasks/${task.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
