"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { EXPENSE_CATEGORIES } from "@/modules/expenses/rules";
import {
  createExpenseAction,
  updateExpenseAction,
  type ExpenseFormState,
} from "@/modules/expenses/actions";
import type { SerializedExpense } from "@/modules/expenses/service";

const initialState: ExpenseFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

type ExpenseFormProps = {
  expense?: SerializedExpense;
  projects: ProjectOption[];
  defaultProjectId?: string;
};

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function ExpenseForm({ expense, projects, defaultProjectId }: ExpenseFormProps) {
  const action = expense ? updateExpenseAction : createExpenseAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {expense ? <input type="hidden" name="id" value={expense.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Project"
          htmlFor="projectId"
          error={state.errors?.projectId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="projectId"
            name="projectId"
            required
            defaultValue={expense?.projectId ?? defaultProjectId ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Select project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} · {project.client.company.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Category" htmlFor="category" error={state.errors?.category?.[0]}>
          <select
            id="category"
            name="category"
            required
            defaultValue={expense?.category ?? ""}
            className={selectClassName}
          >
            <option value="" disabled>
              Select category
            </option>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Date" htmlFor="date" error={state.errors?.date?.[0]}>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={formatDateInput(expense?.date) || formatDateInput(new Date())}
          />
        </FormField>
        <FormField label="Amount" htmlFor="amount" error={state.errors?.amount?.[0]}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={expense?.amount ?? ""}
            placeholder="125.00"
          />
        </FormField>
        <FormField label="Currency" htmlFor="currency" error={state.errors?.currency?.[0]}>
          <Input
            id="currency"
            name="currency"
            defaultValue={expense?.currency ?? "USD"}
            placeholder="USD"
          />
        </FormField>
        <FormField
          label="Description"
          htmlFor="description"
          error={state.errors?.description?.[0]}
          className="sm:col-span-2"
        >
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={expense?.description ?? ""}
            placeholder="Cloud hosting for March…"
            className={`${selectClassName} min-h-20 py-2 placeholder:text-muted-foreground`}
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : expense ? "Save changes" : "Submit expense"}
      </Button>
    </form>
  );
}
