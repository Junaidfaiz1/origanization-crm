import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { TeamForm } from "@/components/team/team-form";
import { getTeamMember, listTeamProjectOptions } from "@/modules/team/service";
import { isProjectClosed } from "@/modules/projects/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit team role" };

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit team assignments"
        description="Ask an owner or project manager to grant PROJECT_UPDATE."
      />
    );
  }

  const { id } = await params;

  let member;
  try {
    member = await getTeamMember(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this assignment"
        description="Check the database connection and try again."
      />
    );
  }

  if (isProjectClosed(member.project.status)) {
    return (
      <ErrorState
        title="Closed projects cannot change team"
        description="Reopen the project before updating assignments."
      />
    );
  }

  const projects = await listTeamProjectOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/team/${member.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {member.resource.user.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit team role
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Role on project</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm member={member} projects={projects} resources={[]} />
        </CardContent>
      </Card>
    </div>
  );
}
