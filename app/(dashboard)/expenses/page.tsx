import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthorizationError } from "@/lib/errors/app-error";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { expenseListFilterSchema } from "@/modules/expenses/validation";
import {
  getExpenseSummary,
  listExpenseProjectOptions,
  listExpenses,
} from "@/modules/expenses/service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ExpensesTable } from "@/components/expenses/expenses-table";
import {
  ExpenseCategoryFilter,
  ExpenseProjectFilter,
  ExpenseStatusFilter,
  ExpenseSummaryCards,
} from "@/components/expenses/expense-summary";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    projectId?: string;
    category?: string;
    cursor?: string;
  }>;
}) {
  const ctx = await requireDashboardUser();

  if (!hasPermission(ctx.permissions, "EXPENSE_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to expenses"
        description="Ask an owner or finance manager to grant EXPENSE_VIEW."
      />
    );
  }

  const params = await searchParams;
  const filter = expenseListFilterSchema.parse({
    search: params.q,
    status: params.status,
    projectId: params.projectId,
    category: params.category,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let summary;
  let projects;
  try {
    [result, summary, projects] = await Promise.all([
      listExpenses(ctx, filter),
      getExpenseSummary(ctx, params.projectId),
      listExpenseProjectOptions(ctx),
    ]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You don’t have access to expenses"
          description="Ask an owner or finance manager to grant EXPENSE_VIEW."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load expenses"
        description="Check the database connection and try again."
      />
    );
  }

  const canCreate = hasPermission(ctx.permissions, "EXPENSE_CREATE");
  const selectedProject = projects.find((project) => project.id === params.projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Finance</p>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Project costs that feed profitability after approval.
          </p>
        </div>
        {canCreate ? (
          <Button asChild className="shrink-0">
            <Link
              href={
                params.projectId
                  ? `/expenses/new?projectId=${params.projectId}`
                  : "/expenses/new"
              }
            >
              <Plus className="h-4 w-4" />
              Submit expense
            </Link>
          </Button>
        ) : null}
      </div>

      <ExpenseSummaryCards summary={summary} />

      <FilterBar>
        <SearchInput placeholder="Search category, project, or submitter" />
        <ExpenseStatusFilter />
        <ExpenseCategoryFilter />
        <ExpenseProjectFilter projects={projects} />
      </FilterBar>

      {selectedProject ? (
        <p className="text-sm text-muted-foreground">
          Filtered to{" "}
          <Link href={`/projects/${selectedProject.id}`} className="font-medium hover:underline">
            {selectedProject.name}
          </Link>
          {" · "}
          <Link href="/expenses" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}

      {result.nodes.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Submit project costs for finance review. Approved amounts feed profit reports."
          action={
            canCreate ? (
              <Button asChild>
                <Link href="/expenses/new">Submit expense</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{result.totalCount} expenses</p>
          <ExpensesTable expenses={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{
              q: params.q,
              status: params.status,
              projectId: params.projectId,
              category: params.category,
            }}
          />
        </>
      )}
    </div>
  );
}
