import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedExpense } from "@/modules/expenses/service";

export function ExpensesTable({ expenses }: { expenses: SerializedExpense[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Submitted by</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/expenses/${expense.id}`} className="font-medium hover:underline">
                    <DateDisplay value={expense.date} />
                  </Link>
                  {expense.description ? (
                    <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                      {expense.description}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">{expense.category}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${expense.projectId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {expense.project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{expense.submittedBy.name}</td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={expense.amount} currency={expense.currency} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={expense.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {expenses.map((expense) => (
          <Link
            key={expense.id}
            href={`/expenses/${expense.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{expense.category}</p>
                <p className="truncate text-sm text-muted-foreground">{expense.project.name}</p>
              </div>
              <StatusBadge status={expense.status} />
            </div>
            <p className="mt-2 text-sm">
              <MoneyDisplay amount={expense.amount} currency={expense.currency} />
              {" · "}
              <DateDisplay value={expense.date} />
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
