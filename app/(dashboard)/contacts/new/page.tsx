import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { ContactForm } from "@/components/contacts/contact-form";
import { listContactCompanyOptions } from "@/modules/contacts/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New contact" };

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "COMPANY_CREATE")) {
    return (
      <ErrorState
        title="You cannot create contacts"
        description="Ask an owner or sales manager to grant COMPANY_CREATE."
      />
    );
  }

  const params = await searchParams;
  const companies = await listContactCompanyOptions(ctx);

  if (companies.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a company first"
          description="Contacts must belong to an active company."
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
        <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground">
          ← Contacts
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create contact
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm companies={companies} defaultCompanyId={params.companyId} />
        </CardContent>
      </Card>
    </div>
  );
}
