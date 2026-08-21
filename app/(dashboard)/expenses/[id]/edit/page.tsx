import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { getExpense, listExpenseProjectOptions } from "@/modules/expenses/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit expense" };

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "EXPENSE_CREATE")) {
    return (
      <ErrorState
        title="You cannot edit expenses"
        description="Ask an owner or project manager to grant EXPENSE_CREATE."
      />
    );
  }

  const { id } = await params;

  let expense;
  try {
    expense = await getExpense(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState
          title="You cannot edit this expense"
          description="You can only update your own pending expenses."
        />
      );
    }
    return (
      <ErrorState
        title="Could not load this expense"
        description="Check the database connection and try again."
      />
    );
  }

  if (expense.status !== "PENDING") {
    return (
      <ErrorState
        title="Expense is locked"
        description="Only pending expenses can be edited."
      />
    );
  }

  const projects = await listExpenseProjectOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/expenses/${expense.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {expense.category}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Edit expense</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm expense={expense} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
