import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getContact, listContactCompanyOptions } from "@/modules/contacts/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { ContactForm } from "@/components/contacts/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit contact" };

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "COMPANY_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit contacts"
        description="Ask an owner or sales manager to grant COMPANY_UPDATE."
      />
    );
  }

  const { id } = await params;

  let contact;
  let companies;
  try {
    [contact, companies] = await Promise.all([
      getContact(ctx, id),
      listContactCompanyOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this contact"
        description="Check the database connection and try again."
      />
    );
  }

  if (contact.archivedAt) {
    return (
      <ErrorState
        title="Archived contacts cannot be edited"
        description="Restore is not available yet. Create a new contact if needed."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/contacts/${contact.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {contact.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit contact
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm contact={contact} companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}
