import Link from "next/link";
import { notFound } from "next/navigation";
import { requireFreelancerUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { getFreelancerTimeEntry } from "@/modules/freelancer-portal/service";
import { stopFreelancerTimerAction } from "@/modules/freelancer-portal/actions";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration } from "@/modules/time-tracking/rules";

export const metadata = { title: "Time entry" };

export default async function FreelancerTimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireFreelancerUser();
  if (!hasPermission(ctx.permissions, "TIME_ENTRY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to time tracking"
        description="Ask the agency to grant TIME_ENTRY_VIEW."
      />
    );
  }

  const { id } = await params;

  let entry;
  try {
    entry = await getFreelancerTimeEntry(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this time entry"
        description="Check the database connection and try again."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/freelancer/time"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← My time
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {entry.project.name}
            </h1>
            {entry.running ? <StatusBadge status="RUNNING" /> : null}
            {entry.billable ? <StatusBadge status="BILLABLE" /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {entry.task?.title ?? "No task linked"}
          </p>
        </div>
        {entry.running && hasPermission(ctx.permissions, "TIME_ENTRY_UPDATE") ? (
          <form action={stopFreelancerTimerAction}>
            <input type="hidden" name="id" value={entry.id} />
            <Button type="submit" variant="outline">
              Stop timer
            </Button>
          </form>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Started: </span>
            <DateDisplay value={entry.startedAt} />
          </p>
          <p>
            <span className="text-muted-foreground">Ended: </span>
            {entry.endedAt ? <DateDisplay value={entry.endedAt} /> : "Running"}
          </p>
          <p>
            <span className="text-muted-foreground">Duration: </span>
            {formatDuration(entry.durationSeconds)}
          </p>
          {entry.notes ? (
            <p className="sm:col-span-2 whitespace-pre-wrap text-muted-foreground">
              {entry.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
