import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getContact } from "@/modules/contacts/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactDetailActions } from "@/components/contacts/contact-detail-actions";

export const metadata = { title: "Contact" };

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "COMPANY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to contacts"
        description="Ask an owner or sales manager to grant COMPANY_VIEW."
      />
    );
  }

  const { id } = await params;

  let contact;
  try {
    contact = await getContact(ctx, id);
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

  const canUpdate =
    hasPermission(ctx.permissions, "COMPANY_UPDATE") && !contact.archivedAt;
  const canArchive = canUpdate && contact.primaryClientCount === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground">
            ← Contacts
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {contact.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contact.designation ?? "No designation"} ·{" "}
            <Link
              href={`/companies/${contact.company.id}`}
              className="hover:text-foreground hover:underline"
            >
              {contact.company.name}
            </Link>{" "}
            · Created <DateDisplay value={contact.createdAt} />
          </p>
        </div>
        <ContactDetailActions
          contactId={contact.id}
          canUpdate={canUpdate}
          canArchive={canArchive}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={contact.email} link={`mailto:${contact.email}`} />
            <Field label="Phone" value={contact.phone} link={`tel:${contact.phone}`} />
            <Field label="Designation" value={contact.designation} />
            <Field label="Company" value={contact.company.name} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Primary for clients</span>
              <span className="font-medium">{contact.primaryClientCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Contacts linked as a client&apos;s primary person cannot be archived until
              reassigned.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  link,
}: {
  label: string;
  value: string | null | undefined;
  link?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value && link ? (
        <a href={link} className="mt-1 block break-words text-sm hover:underline">
          {value}
        </a>
      ) : (
        <p className="mt-1 break-words text-sm">{value || "—"}</p>
      )}
    </div>
  );
}
