import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { listExpenseProjectOptions } from "@/modules/expenses/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Submit expense" };

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "EXPENSE_CREATE")) {
    return (
      <ErrorState
        title="You cannot submit expenses"
        description="Ask an owner or project manager to grant EXPENSE_CREATE."
      />
    );
  }

  const params = await searchParams;
  const projects = await listExpenseProjectOptions(ctx);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="No projects available"
          description="Expenses must be linked to an active project."
        />
        <p className="text-center text-sm">
          <Link href="/projects" className="font-medium hover:underline">
            View projects
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/expenses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Expenses
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Submit expense</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm projects={projects} defaultProjectId={params.projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
