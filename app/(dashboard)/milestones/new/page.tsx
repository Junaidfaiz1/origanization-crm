import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { MilestoneForm } from "@/components/milestones/milestone-form";
import { listMilestoneProjectOptions } from "@/modules/milestones/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New milestone" };

export default async function NewMilestonePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot create milestones"
        description="Ask an owner or project manager to grant PROJECT_UPDATE."
      />
    );
  }

  const params = await searchParams;
  const projects = await listMilestoneProjectOptions(ctx);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a project first"
          description="Milestones must belong to an active project."
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
        <Link href="/milestones" className="text-sm text-muted-foreground hover:text-foreground">
          ← Milestones
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create milestone
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Milestone details</CardTitle>
        </CardHeader>
        <CardContent>
          <MilestoneForm projects={projects} defaultProjectId={params.projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
