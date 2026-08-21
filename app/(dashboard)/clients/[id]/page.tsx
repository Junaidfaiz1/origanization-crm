import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getClient } from "@/modules/clients/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientDetailActions } from "@/components/clients/client-detail-actions";

export const metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "CLIENT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to clients"
        description="Ask an owner or sales manager to grant CLIENT_VIEW."
      />
    );
  }

  const { id } = await params;

  let client;
  try {
    client = await getClient(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this client"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpdate =
    hasPermission(ctx.permissions, "CLIENT_UPDATE") && !client.archivedAt;
  const canArchive = hasPermission(ctx.permissions, "CLIENT_DELETE") && !client.archivedAt;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/clients" className="text-sm text-muted-foreground hover:text-foreground">
            ← Clients
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {client.company.name}
            </h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created <DateDisplay value={client.createdAt} />
          </p>
        </div>
        <ClientDetailActions
          clientId={client.id}
          canUpdate={canUpdate}
          canArchive={canArchive}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Company"
              value={client.company.name}
              href={`/companies/${client.company.id}`}
            />
            <Field
              label="Primary contact"
              value={client.primaryContact?.name}
              href={
                client.primaryContact ? `/contacts/${client.primaryContact.id}` : undefined
              }
            />
            <Field label="Email" value={client.primaryContact?.email} />
            <Field label="Notes" value={client.notes} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Opportunities</span>
              <Link
                href={`/opportunities?clientId=${client.id}`}
                className="font-medium hover:underline"
              >
                {client.opportunityCount}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Proposals</span>
              <span className="font-medium">{client.proposalCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Projects</span>
              <Link
                href={`/projects?clientId=${client.id}`}
                className="font-medium hover:underline"
              >
                {client.projectCount}
              </Link>
            </div>
            {canUpdate ? (
              <>
                <Link
                  href={`/opportunities/new?clientId=${client.id}`}
                  className="inline-block text-xs font-medium hover:underline"
                >
                  Add opportunity for this client
                </Link>
                <Link
                  href={`/projects/new?clientId=${client.id}`}
                  className="inline-block text-xs font-medium hover:underline"
                >
                  Create project for this client
                </Link>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  href,
  className,
}: {
  label: string;
  value?: string | null;
  href?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value && href ? (
        <Link href={href} className="mt-1 block break-words text-sm hover:underline">
          {value}
        </Link>
      ) : (
        <p className="mt-1 break-words text-sm">{value || "—"}</p>
      )}
    </div>
  );
}
