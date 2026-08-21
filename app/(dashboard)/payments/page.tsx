import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { DEFAULT_LIST_SORT_OPTIONS } from "@/lib/ui/list-sort";
import { paymentListFilterSchema } from "@/modules/payments/validation";
import {
  getPaymentSummary,
  listPayments,
} from "@/modules/payments/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { ResultCount } from "@/components/shared/result-count";
import { SortSelect } from "@/components/shared/sort-select";
import { PaymentsTable } from "@/components/payments/payments-table";
import {
  PaymentMethodFilter,
  PaymentStatusFilter,
  PaymentSummaryCards,
} from "@/components/payments/payment-summary";

export const metadata = { title: "Payments" };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    method?: string;
    invoiceId?: string;
    sort?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "PAYMENT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to payments"
        description="Ask a finance manager to grant PAYMENT_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = paymentListFilterSchema.parse({
    search: params.q,
    status: params.status,
    method: params.method,
    invoiceId: params.invoiceId,
    sort: params.sort,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  try {
    [result, summary] = await Promise.all([
      listPayments(ctx, filter),
      getPaymentSummary(ctx, params.invoiceId),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to payments"
          description="Ask a finance manager to grant PAYMENT_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load payments"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "PAYMENT_CREATE");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        description="Record client payments received outside the app and keep invoice balances in sync."
        actions={
          canCreate ? (
            <Button asChild className="shrink-0">
              <Link
                href={
                  params.invoiceId
                    ? `/payments/new?invoiceId=${params.invoiceId}`
                    : "/payments/new"
                }
              >
                <Plus className="h-4 w-4" />
                Record payment
              </Link>
            </Button>
          ) : undefined
        }
      />

      <PaymentSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search invoice, client, or reference" />
        <PaymentStatusFilter />
        <PaymentMethodFilter />
        <SortSelect options={[...DEFAULT_LIST_SORT_OPTIONS]} />
      </FilterBar>

      {params.invoiceId ? (
        <p className="text-sm text-muted-foreground">
          Filtered to one invoice ·{" "}
          <Link href="/payments" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          description="When a client pays by bank transfer, cash, or cheque, record it here to update the invoice."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/payments/new">Record payment</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ResultCount count={result.totalCount} label="payments" />
          <PaymentsTable payments={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              method: params.method,
              invoiceId: params.invoiceId,
              sort: params.sort,
            }}
          />
        </>
      )}
    </div>
  );
}
