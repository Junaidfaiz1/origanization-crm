import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { TimeEntryForm } from "@/components/time-tracking/time-entry-form";
import {
  listTimeEntryProjectOptions,
  listTimeEntryTaskOptions,
  listTimeEntryUserOptions,
} from "@/modules/time-tracking/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Log time" };

export default async function NewTimeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; taskId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "TIME_ENTRY_CREATE")) {
    return (
      <ErrorState
        title="You cannot log time"
        description="Ask an owner or project manager to grant TIME_ENTRY_CREATE."
      />
    );
  }

  const params = await searchParams;
  const [projects, tasks, users] = await Promise.all([
    listTimeEntryProjectOptions(ctx),
    listTimeEntryTaskOptions(ctx, params.projectId),
    listTimeEntryUserOptions(ctx),
  ]);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="No active projects"
          description="Time can only be logged on open, non-archived projects."
        />
        <p className="text-center text-sm">
          <Link href="/projects" className="font-medium hover:underline">
            View projects
          </Link>
        </p>
      </div>
    );
  }

  const canAssignOthers =
    hasPermission(ctx.permissions, "TIME_ENTRY_DELETE") ||
    hasPermission(ctx.permissions, "REPORT_VIEW");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/time-tracking"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Time tracking
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Log time</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Time entry</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEntryForm
            projects={projects}
            tasks={tasks}
            users={users}
            defaultProjectId={params.projectId}
            defaultTaskId={params.taskId}
            canAssignOthers={canAssignOthers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
