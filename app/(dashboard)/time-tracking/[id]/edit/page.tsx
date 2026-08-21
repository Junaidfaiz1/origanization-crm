import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { TimeEntryForm } from "@/components/time-tracking/time-entry-form";
import {
  getTimeEntry,
  listTimeEntryProjectOptions,
  listTimeEntryTaskOptions,
} from "@/modules/time-tracking/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit time entry" };

export default async function EditTimeEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "TIME_ENTRY_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit time entries"
        description="Ask an owner or project manager to grant TIME_ENTRY_UPDATE."
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
          title="You cannot edit this entry"
          description="You can only update your own time entries."
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

  if (entry.running) {
    return (
      <ErrorState
        title="Stop the timer first"
        description="Running timers must be stopped before editing."
      />
    );
  }

  const [projects, tasks] = await Promise.all([
    listTimeEntryProjectOptions(ctx),
    listTimeEntryTaskOptions(ctx, entry.projectId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/time-tracking/${entry.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Time entry
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Edit time entry</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Time entry</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEntryForm entry={entry} projects={projects} tasks={tasks} users={[]} />
        </CardContent>
      </Card>
    </div>
  );
}
