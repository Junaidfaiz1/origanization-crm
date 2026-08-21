import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getCompany } from "@/modules/companies/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { CompanyForm } from "@/components/companies/company-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit company" };

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "COMPANY_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit companies"
        description="Ask an owner or sales manager to grant COMPANY_UPDATE."
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
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/companies/${company.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {company.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit company
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm company={company} />
        </CardContent>
      </Card>
    </div>
  );
}
