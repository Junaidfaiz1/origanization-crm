import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeEntryDetailActions } from "@/components/time-tracking/time-entry-detail-actions";
import { DurationDisplay } from "@/components/time-tracking/active-timer-panel";
import { formatDuration } from "@/modules/time-tracking/rules";
import { getTimeEntry } from "@/modules/time-tracking/service";

export const metadata = { title: "Time entry" };

export default async function TimeEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "TIME_ENTRY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to time tracking"
        description="Ask an owner or project manager to grant TIME_ENTRY_VIEW."
      />
    );
  }

  const { id } = await params;

  let entry;
  try {
    entry = await getTimeEntry(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You cannot view this entry"
          description="You can only open your own time entries."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load this time entry"
        description="Check the database connection and try again."
      />
    );
  }

  const isOwn = entry.userId === ctx.userId;
  const canViewAll =
    hasPermission(ctx.permissions, "TIME_ENTRY_DELETE") ||
    hasPermission(ctx.permissions, "REPORT_VIEW");
  const canUpdate =
    hasPermission(ctx.permissions, "TIME_ENTRY_UPDATE") && (canViewAll || isOwn);
  const canDelete = canUpdate;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/time-tracking"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Time tracking
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {formatDuration(entry.durationSeconds)}
            </h1>
            {entry.running ? <StatusBadge status="IN_PROGRESS" /> : null}
            <StatusBadge status={entry.billable ? "ACTIVE" : "INACTIVE"} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${entry.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {entry.project.name}
            </Link>
            {entry.task ? (
              <>
                {" · "}
                <Link
                  href={`/tasks/${entry.task.id}`}
                  className="hover:text-foreground hover:underline"
                >
                  {entry.task.title}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <TimeEntryDetailActions
          entryId={entry.id}
          running={entry.running}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Entry</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Person" value={entry.user.name} />
            <Field label="Duration">
              <DurationDisplay seconds={entry.durationSeconds} />
            </Field>
            <Field label="Start">
              <DateDisplay value={entry.startedAt} />
            </Field>
            <Field label="End">
              {entry.endedAt ? <DateDisplay value={entry.endedAt} /> : "Running"}
            </Field>
            <Field label="Hourly rate">
              {entry.hourlyRate ? <MoneyDisplay amount={entry.hourlyRate} /> : "—"}
            </Field>
            <Field label="Billable">{entry.billable ? "Yes" : "No"}</Field>
            <Field label="Notes" value={entry.notes} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{entry.project.clientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={entry.project.status} />
            </div>
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
