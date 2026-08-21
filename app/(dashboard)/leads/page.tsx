import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { leadListFilterSchema } from "@/modules/leads/validation";
import { isLeadStatus } from "@/modules/leads/rules";
import { listLeads } from "@/modules/leads/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadStatusFilter } from "@/components/leads/lead-status-filter";

export const metadata = { title: "Leads" };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cursor?: string }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "LEAD_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to leads"
        description="Ask an owner or admin to grant LEAD_VIEW."
      />
    );
  }

  const params = await searchParams;
  const status = params.status && isLeadStatus(params.status) ? params.status : undefined;
  const filter = leadListFilterSchema.parse({
    search: params.q,
    status,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  try {
    result = await listLeads(ctx, filter);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to leads"
          description="Ask an owner or admin to grant LEAD_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load leads"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "LEAD_CREATE");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">CRM</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture inbound interest, assign owners, and convert qualified leads.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link href="/leads/new">
              <Plus className="h-4 w-4" />
              New lead
            </Link>
          </Button>
        ) : null}
      </div>

      <FilterBar>
        <SearchInput placeholder="Search name, email, or company" />
        <LeadStatusFilter />
      </FilterBar>

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Capture a lead to start the sales pipeline."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/leads/new">Create lead</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} leads</p>
          <LeadsTable leads={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{ q: params.q, status: params.status }}
          />
        </>
      )}
    </div>
  );
}
