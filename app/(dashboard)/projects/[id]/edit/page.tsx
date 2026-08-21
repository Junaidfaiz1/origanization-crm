import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { ProjectForm } from "@/components/projects/project-form";
import {
  getProject,
  listProjectClientOptions,
  listProjectOpportunityOptions,
  listProjectProposalOptions,
} from "@/modules/projects/service";
import { listAssignableUsers } from "@/modules/leads/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit projects"
        description="Ask an owner or project manager to grant PROJECT_UPDATE."
      />
    );
  }

  const { id } = await params;

  let project;
  try {
    project = await getProject(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this project"
        description="Check the database connection and try again."
      />
    );
  }

  if (project.archivedAt) {
    return (
      <ErrorState
        title="Archived projects cannot be edited"
        description="Restore is not available yet. View the project detail page instead."
      />
    );
  }

  const [clients, opportunities, proposals, managers] = await Promise.all([
    listProjectClientOptions(ctx),
    listProjectOpportunityOptions(ctx, project.clientId),
    listProjectProposalOptions(ctx, project.clientId),
    listAssignableUsers(ctx.organizationId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Edit project</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            project={project}
            clients={clients}
            opportunities={opportunities}
            proposals={proposals}
            managers={managers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
