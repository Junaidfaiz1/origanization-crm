import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { TeamForm } from "@/components/team/team-form";
import {
  listAssignableResources,
  listTeamProjectOptions,
} from "@/modules/team/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Assign team member" };

export default async function NewTeamMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot assign team members"
        description="Ask an owner or project manager to grant PROJECT_UPDATE."
      />
    );
  }

  const params = await searchParams;
  const [projects, resources] = await Promise.all([
    listTeamProjectOptions(ctx),
    listAssignableResources(ctx, params.projectId),
  ]);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a project first"
          description="Team members must be assigned to an active project."
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
        <Link href="/team" className="text-sm text-muted-foreground hover:text-foreground">
          ← Team
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Assign team member
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Assignment details</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm
            projects={projects}
            resources={resources}
            defaultProjectId={params.projectId}
          />
        </CardContent>
      </Card>
      {resources.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Need a resource profile?{" "}
          <Link href="/resources/new" className="font-medium hover:underline">
            Create resource
          </Link>
        </p>
      ) : null}
    </div>
  );
}
