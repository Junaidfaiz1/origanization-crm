import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedExpense } from "@/modules/expenses/service";

const columns: DataTableColumn<SerializedExpense>[] = [
  {
    id: "date",
    header: "Date",
    cell: (expense) => (
      <>
        <Link href={`/expenses/${expense.id}`} className="font-medium hover:underline">
          <DateDisplay value={expense.date} />
        </Link>
        {expense.description ? (
          <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
            {expense.description}
          </p>
        ) : null}
      </>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: (expense) => expense.category,
  },
  {
    id: "project",
    header: "Project",
    cell: (expense) => (
      <Link
        href={`/projects/${expense.projectId}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {expense.project.name}
      </Link>
    ),
  },
  {
    id: "submittedBy",
    header: "Submitted by",
    className: "text-muted-foreground",
    cell: (expense) => expense.submittedBy.name,
  },
  {
    id: "amount",
    header: "Amount",
    cell: (expense) => (
      <MoneyDisplay amount={expense.amount} currency={expense.currency} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (expense) => <StatusBadge status={expense.status} />,
  },
];

export function ExpensesTable({ expenses }: { expenses: SerializedExpense[] }) {
  return (
    <DataTable
      rows={expenses}
      columns={columns}
      rowKey={(expense) => expense.id}
      caption="Expenses"
      minWidthClassName="min-w-[52rem]"
      mobileRow={(expense) => (
        <Link
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
      )}
    />
  );
}
