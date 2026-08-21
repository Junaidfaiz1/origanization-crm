import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { contactListFilterSchema } from "@/modules/contacts/validation";
import { listContacts, listContactCompanyOptions } from "@/modules/contacts/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { CompanyFilter } from "@/components/contacts/company-filter";

export const metadata = { title: "Contacts" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; companyId?: string; cursor?: string }>;
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

  const params = await searchParams;
  const filter = contactListFilterSchema.parse({
    search: params.q,
    companyId: params.companyId,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let companies;
  try {
    [result, companies] = await Promise.all([
      listContacts(ctx, filter),
      listContactCompanyOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to contacts"
          description="Ask an owner or sales manager to grant COMPANY_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load contacts"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "COMPANY_CREATE");
  const selectedCompany = companies.find((company) => company.id === params.companyId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">CRM</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People at client companies. A company can have multiple contacts.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link
              href={
                params.companyId
                  ? `/contacts/new?companyId=${params.companyId}`
                  : "/contacts/new"
              }
            >
              <Plus className="h-4 w-4" />
              New contact
            </Link>
          </Button>
        ) : null}
      </div>

      <FilterBar>
        <SearchInput placeholder="Search name, email, company, or role" />
        <CompanyFilter companies={companies} />
      </FilterBar>

      {selectedCompany ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/companies/${selectedCompany.id}`} className="font-medium hover:underline">
            {selectedCompany.name}
          </Link>
          {" · "}
          <Link href="/contacts" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No contacts yet"
          description="Add contacts to keep track of people at each company."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/contacts/new">Create contact</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} contacts</p>
          <ContactsTable contacts={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{ q: params.q, companyId: params.companyId }}
          />
        </>
      )}
    </div>
  );
}
