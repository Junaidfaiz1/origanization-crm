import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { ClientForm } from "@/components/clients/client-form";
import {
  listClientCompanyOptions,
  listClientContactOptions,
} from "@/modules/clients/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New client" };

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string; primaryContactId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "CLIENT_CREATE")) {
    return (
      <ErrorState
        title="You cannot create clients"
        description="Ask an owner or sales manager to grant CLIENT_CREATE."
      />
    );
  }

  const params = await searchParams;
  const [companies, contacts] = await Promise.all([
    listClientCompanyOptions(ctx),
    listClientContactOptions(ctx),
  ]);

  if (companies.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a company first"
          description="Clients must belong to an active company."
        />
        <p className="text-center text-sm">
          <Link href="/companies/new" className="font-medium hover:underline">
            Create company
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/clients" className="text-sm text-muted-foreground hover:text-foreground">
          ← Clients
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create client
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client account</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            companies={companies}
            contacts={contacts}
            defaultCompanyId={params.companyId}
            defaultPrimaryContactId={params.primaryContactId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
