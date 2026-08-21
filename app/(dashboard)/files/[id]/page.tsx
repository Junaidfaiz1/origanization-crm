import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDetailActions } from "@/components/files/file-detail-actions";
import { getFile, getFileDownloadUrl } from "@/modules/files/service";
import { isProjectClosed } from "@/modules/projects/rules";
import { prisma } from "@/lib/prisma/client";

export const metadata = { title: "File" };

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function FileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "PROJECT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to files"
        description="Ask an owner or project manager to grant PROJECT_VIEW."
      />
    );
  }

  const { id } = await params;

  let file;
  let download;
  try {
    file = await getFile(ctx, id);
    download = await getFileDownloadUrl(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this file"
        description="Check the database connection and try again."
      />
    );
  }

  let projectClosed = false;
  if (file.entityType === "Project") {
    const project = await prisma.project.findFirst({
      where: { id: file.entityId, organizationId: ctx.organizationId },
      select: { status: true, archivedAt: true },
    });
    projectClosed = Boolean(
      project?.archivedAt || (project && isProjectClosed(project.status)),
    );
  }

  const canDelete =
    hasPermission(ctx.permissions, "PROJECT_UPDATE") && !projectClosed;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/files" className="text-sm text-muted-foreground hover:text-foreground">
            ← Files
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {file.fileName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {file.entityType}
            {file.entityType === "Project" ? (
              <>
                {" · "}
                <Link
                  href={`/projects/${file.entityId}`}
                  className="hover:text-foreground hover:underline"
                >
                  View project
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <FileDetailActions
          fileId={file.id}
          downloadUrl={download.url}
          canDelete={canDelete}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="MIME type" value={file.mimeType} />
          <Field label="Size" value={formatBytes(file.size)} />
          <Field label="Uploaded by" value={file.uploadedBy.name} />
          <Field label="Uploaded">
            <DateDisplay value={file.createdAt} />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children ?? value ?? "—"}</div>
    </div>
  );
}
