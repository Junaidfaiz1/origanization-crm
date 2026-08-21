import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { ResourceForm } from "@/components/resources/resource-form";
import { getResource, listSkillOptions } from "@/modules/resources/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit resource" };

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "RESOURCE_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit resources"
        description="Ask an owner or project manager to grant RESOURCE_UPDATE."
      />
    );
  }

  const { id } = await params;

  let resource;
  try {
    resource = await getResource(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this resource"
        description="Check the database connection and try again."
      />
    );
  }

  const skills = await listSkillOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/resources/${resource.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {resource.user.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Edit resource</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Resource profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceForm resource={resource} members={[]} skills={skills} />
        </CardContent>
      </Card>
    </div>
  );
}
