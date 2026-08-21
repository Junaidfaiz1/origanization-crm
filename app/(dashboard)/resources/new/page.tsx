import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { ResourceForm } from "@/components/resources/resource-form";
import {
  listResourceMemberOptions,
  listSkillOptions,
} from "@/modules/resources/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New resource" };

export default async function NewResourcePage() {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "RESOURCE_CREATE")) {
    return (
      <ErrorState
        title="You cannot create resources"
        description="Ask an owner or project manager to grant RESOURCE_CREATE."
      />
    );
  }

  const [members, skills] = await Promise.all([
    listResourceMemberOptions(ctx),
    listSkillOptions(ctx),
  ]);

  if (members.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="No eligible team members"
          description="Every active member already has a resource profile, or no members exist yet."
        />
        <p className="text-center text-sm">
          <Link href="/resources" className="font-medium hover:underline">
            Back to resources
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/resources" className="text-sm text-muted-foreground hover:text-foreground">
          ← Resources
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Create resource</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Resource profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceForm members={members} skills={skills} />
        </CardContent>
      </Card>
    </div>
  );
}
