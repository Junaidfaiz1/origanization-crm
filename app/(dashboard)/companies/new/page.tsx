import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { CompanyForm } from "@/components/companies/company-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New company" };

export default async function NewCompanyPage() {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "COMPANY_CREATE")) {
    return (
      <ErrorState
        title="You cannot create companies"
        description="Ask an owner or sales manager to grant COMPANY_CREATE."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/companies" className="text-sm text-muted-foreground hover:text-foreground">
          ← Companies
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create company
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyForm />
        </CardContent>
      </Card>
    </div>
  );
}
