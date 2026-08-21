import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseDetailActions } from "@/components/expenses/expense-detail-actions";
import { getExpense } from "@/modules/expenses/service";

export const metadata = { title: "Expense" };

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
          title="You cannot view this expense"
          description="You can only open expenses you submitted."
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

  const isOwn = expense.submittedById === ctx.userId;
  const canViewAll =
    hasPermission(ctx.permissions, "EXPENSE_UPDATE") ||
    hasPermission(ctx.permissions, "REPORT_VIEW");
  const canReview =
    hasPermission(ctx.permissions, "EXPENSE_UPDATE") && expense.status === "PENDING";
  const canUpdate =
    expense.status === "PENDING" &&
    hasPermission(ctx.permissions, "EXPENSE_CREATE") &&
    (canViewAll || isOwn);
  const canDelete =
    expense.status !== "APPROVED" &&
    hasPermission(ctx.permissions, "EXPENSE_CREATE") &&
    (canViewAll || isOwn);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/expenses" className="text-sm text-muted-foreground hover:text-foreground">
            ← Expenses
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {expense.category}
            </h1>
            <StatusBadge status={expense.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${expense.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {expense.project.name}
            </Link>
            {" · "}
            {expense.submittedBy.name}
          </p>
        </div>
        <ExpenseDetailActions
          expenseId={expense.id}
          status={expense.status}
          canUpdate={canUpdate}
          canReview={canReview}
          canDelete={canDelete}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expense</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount">
              <MoneyDisplay amount={expense.amount} currency={expense.currency} />
            </Field>
            <Field label="Expense date">
              <DateDisplay value={expense.date} />
            </Field>
            <Field label="Submitted">
              <DateDisplay value={expense.createdAt} />
            </Field>
            <Field label="Updated">
              <DateDisplay value={expense.updatedAt} />
            </Field>
            <Field label="Description" value={expense.description} className="sm:col-span-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={expense.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{expense.project.clientName}</span>
            </div>
            {expense.status === "PENDING" ? (
              <p className="text-xs text-muted-foreground">
                Pending expenses are excluded from approved profit until finance approves them.
              </p>
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
  children,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children ?? value ?? "—"}</div>
    </div>
  );
}
