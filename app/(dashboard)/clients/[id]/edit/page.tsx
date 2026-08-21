import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import {
  getClient,
  listClientCompanyOptions,
  listClientContactOptions,
} from "@/modules/clients/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit client" };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "CLIENT_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit clients"
        description="Ask an owner or sales manager to grant CLIENT_UPDATE."
      />
    );
  }

  const { id } = await params;

  let client;
  let companies;
  let contacts;
  try {
    [client, companies, contacts] = await Promise.all([
      getClient(ctx, id),
      listClientCompanyOptions(ctx),
      listClientContactOptions(ctx),
    ]);
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

  if (client.archivedAt) {
    return (
      <ErrorState
        title="Archived clients cannot be edited"
        description="Restore is not available yet. Create a new client if needed."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/clients/${client.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {client.company.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit client
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client account</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm client={client} companies={companies} contacts={contacts} />
        </CardContent>
      </Card>
    </div>
  );
}
