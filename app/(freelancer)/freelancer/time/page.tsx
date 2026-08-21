import Link from "next/link";
import { requireFreelancerUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import {
  listFreelancerTimeEntries,
  listFreelancerTimeOptions,
} from "@/modules/freelancer-portal/service";
import { FreelancerTimerPanel } from "@/components/freelancer/freelancer-timer-panel";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/modules/time-tracking/rules";

export const metadata = { title: "My time" };

export default async function FreelancerTimePage() {
  const ctx = await requireFreelancerUser();
  if (!hasPermission(ctx.permissions, "TIME_ENTRY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to time tracking"
        description="Ask the agency to grant TIME_ENTRY_VIEW."
      />
    );
  }

  let data;
  let options = { projects: [] as { id: string; name: string }[], tasks: [] as { id: string; title: string; projectId: string }[] };
  try {
    data = await listFreelancerTimeEntries(ctx);
    if (hasPermission(ctx.permissions, "TIME_ENTRY_CREATE")) {
      options = await listFreelancerTimeOptions(ctx);
    }
  } catch {
    return (
      <ErrorState
        title="Could not load time entries"
        description="Check the database connection and try again."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">My time</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your own timers and entries. Agency rates and margins are not shown here.
        </p>
      </div>

      <FreelancerTimerPanel
        activeEntry={data.activeTimer}
        projects={options.projects}
        tasks={options.tasks}
        canCreate={hasPermission(ctx.permissions, "TIME_ENTRY_CREATE")}
      />

      {data.entries.length === 0 ? (
        <EmptyState
          title="No time logged yet"
          description="Start a timer on an assigned task to track your work."
        />
      ) : (
        <div className="space-y-3">
          {data.entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/freelancer/time/${entry.id}`}
                      className="font-medium hover:underline"
                    >
                      {entry.project.name}
                    </Link>
                    {entry.running ? <StatusBadge status="RUNNING" /> : null}
                    {entry.billable ? <StatusBadge status="BILLABLE" /> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {entry.task?.title ?? "No task"}
                    {" · "}
                    <DateDisplay value={entry.startedAt} />
                    {" · "}
                    {formatDuration(entry.durationSeconds)}
                  </p>
                </div>
                <Link
                  href={`/freelancer/time/${entry.id}`}
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
