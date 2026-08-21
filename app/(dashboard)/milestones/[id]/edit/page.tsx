import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { MilestoneForm } from "@/components/milestones/milestone-form";
import {
  getMilestone,
  listMilestoneProjectOptions,
} from "@/modules/milestones/service";
import { isProjectClosed } from "@/modules/projects/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit milestone" };

export default async function EditMilestonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit milestones"
        description="Ask an owner or project manager to grant PROJECT_UPDATE."
      />
    );
  }

  const { id } = await params;

  let milestone;
  try {
    milestone = await getMilestone(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this milestone"
        description="Check the database connection and try again."
      />
    );
  }

  if (isProjectClosed(milestone.project.status)) {
    return (
      <ErrorState
        title="Closed projects cannot edit milestones"
        description="Reopen the project before changing delivery checkpoints."
      />
    );
  }

  const projects = await listMilestoneProjectOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/milestones/${milestone.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {milestone.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit milestone
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Milestone details</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneForm milestone={milestone} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
