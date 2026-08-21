import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getCompany } from "@/modules/companies/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { DateDisplay } from "@/components/shared/date-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyDetailActions } from "@/components/companies/company-detail-actions";

export const metadata = { title: "Company" };

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "COMPANY_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to companies"
        description="Ask an owner or admin to grant COMPANY_VIEW."
      />
    );
  }

  const { id } = await params;

  let company;
  try {
    company = await getCompany(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this company"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpdate =
    hasPermission(ctx.permissions, "COMPANY_UPDATE") && !company.archivedAt;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/companies" className="text-sm text-muted-foreground hover:text-foreground">
            ← Companies
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {company.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {company.industry ?? "No industry"} · Created{" "}
            <DateDisplay value={company.createdAt} />
          </p>
        </div>
        <CompanyDetailActions companyId={company.id} canUpdate={canUpdate} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Website" value={company.website} link />
            <Field label="Industry" value={company.industry} />
            <Field label="Address" value={company.address} />
            <Field label="City" value={company.city} />
            <Field label="Country" value={company.country} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contacts</span>
              <Link
                href={`/contacts?companyId=${company.id}`}
                className="font-medium hover:underline"
              >
                {company.contactCount}
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Clients</span>
              <Link
                href={`/clients?companyId=${company.id}`}
                className="font-medium hover:underline"
              >
                {company.clientCount}
              </Link>
            </div>
            {canUpdate ? (
              <div className="space-y-2 text-xs">
                <Link
                  href={`/contacts/new?companyId=${company.id}`}
                  className="block font-medium hover:underline"
                >
                  Add contact for this company
                </Link>
                <Link
                  href={`/clients/new?companyId=${company.id}`}
                  className="block font-medium hover:underline"
                >
                  Add client for this company
                </Link>
              </div>
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
  link = false,
}: {
  label: string;
  value: string | null | undefined;
  link?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      {value && link ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 break-all text-sm hover:underline"
        >
          {value}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <p className="mt-1 break-words text-sm">{value || "—"}</p>
      )}
    </div>
  );
}
