import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { FileUploadForm } from "@/components/files/file-upload-form";
import { listFileProjectOptions } from "@/modules/files/service";
import { isR2StorageConfigured } from "@/lib/storage/storage-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Upload file" };

export default async function NewFilePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot upload files"
        description="Ask an owner or project manager to grant PROJECT_UPDATE."
      />
    );
  }

  if (!isR2StorageConfigured()) {
    return (
      <ErrorState
        title="R2 storage is not configured"
        description="Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in .env."
      />
    );
  }

  const params = await searchParams;
  const projects = await listFileProjectOptions(ctx);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a project first"
          description="Files must be attached to an active project."
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
        <Link href="/files" className="text-sm text-muted-foreground hover:text-foreground">
          ← Files
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Upload file</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>File details</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploadForm projects={projects} defaultProjectId={params.projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
