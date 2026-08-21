import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { RequirementForm } from "@/components/requirements/requirement-form";
import {
  getRequirement,
  listRequirementProjectOptions,
} from "@/modules/requirements/service";
import { isProjectClosed } from "@/modules/projects/rules";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit requirement" };

export default async function EditRequirementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit requirements"
        description="Ask an owner or project manager to grant PROJECT_UPDATE."
      />
    );
  }

  const { id } = await params;

  let requirement;
  try {
    requirement = await getRequirement(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this requirement"
        description="Check the database connection and try again."
      />
    );
  }

  if (isProjectClosed(requirement.project.status)) {
    return (
      <ErrorState
        title="Closed projects cannot edit requirements"
        description="Reopen the project before changing scoped needs."
      />
    );
  }

  const projects = await listRequirementProjectOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/requirements/${requirement.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {requirement.title}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit requirement
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Requirement details</CardTitle>
        </CardHeader>
        <CardContent>
          <RequirementForm requirement={requirement} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
