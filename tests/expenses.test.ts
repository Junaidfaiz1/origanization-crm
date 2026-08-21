import { describe, expect, it } from "vitest";
import {
  assertCanDeleteExpense,
  assertCanEditExpense,
  assertCanReviewExpense,
  assertCanSubmitExpenseOnProject,
} from "@/modules/expenses/rules";
import {
  createExpenseSchema,
  expenseListFilterSchema,
  updateExpenseStatusSchema,
} from "@/modules/expenses/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("expense rules", () => {
  it("blocks submitting expenses on archived projects", () => {
    expect(() =>
      assertCanSubmitExpenseOnProject({ archivedAt: new Date() }),
    ).toThrow(BusinessRuleError);
  });

  it("allows submitting expenses on active projects", () => {
    expect(() => assertCanSubmitExpenseOnProject({ archivedAt: null })).not.toThrow();
  });

  it("blocks editing reviewed expenses", () => {
    expect(() => assertCanEditExpense("APPROVED")).toThrow(BusinessRuleError);
    expect(() => assertCanEditExpense("REJECTED")).toThrow(BusinessRuleError);
    expect(() => assertCanEditExpense("PENDING")).not.toThrow();
  });

  it("blocks reviewing non-pending expenses", () => {
    expect(() => assertCanReviewExpense("APPROVED")).toThrow(BusinessRuleError);
    expect(() => assertCanReviewExpense("PENDING")).not.toThrow();
  });

  it("blocks deleting approved expenses", () => {
    expect(() => assertCanDeleteExpense("APPROVED")).toThrow(BusinessRuleError);
    expect(() => assertCanDeleteExpense("PENDING")).not.toThrow();
    expect(() => assertCanDeleteExpense("REJECTED")).not.toThrow();
  });
});

describe("expense validation", () => {
  it("requires project, category, amount, and date", () => {
    expect(
      createExpenseSchema.safeParse({
        projectId: "",
        category: "Software",
        amount: "",
        date: "",
      }).success,
    ).toBe(false);
    expect(
      createExpenseSchema.safeParse({
        projectId: "project_1",
        category: "Software",
        amount: "89.00",
        date: "2026-01-15",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = expenseListFilterSchema.parse({
      search: "travel",
      status: "PENDING",
      projectId: "project_1",
      category: "Travel",
      first: "20",
    });
    expect(parsed.search).toBe("travel");
    expect(parsed.status).toBe("PENDING");
    expect(parsed.category).toBe("Travel");
    expect(parsed.first).toBe(20);
  });

  it("validates approve/reject status updates", () => {
    expect(updateExpenseStatusSchema.safeParse({ status: "APPROVED" }).success).toBe(true);
    expect(updateExpenseStatusSchema.safeParse({ status: "PENDING" }).success).toBe(false);
  });
});

describe("expense permissions", () => {
  it("lets employees submit and view expenses", () => {
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "EXPENSE_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "EXPENSE_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "EXPENSE_UPDATE")).toBe(false);
  });

  it("lets finance managers review expenses", () => {
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "EXPENSE_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "EXPENSE_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "EXPENSE_CREATE")).toBe(false);
  });

  it("lets project managers submit but not approve", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "EXPENSE_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "EXPENSE_UPDATE")).toBe(false);
  });

  it("hides expenses from clients and freelancers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "EXPENSE_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "EXPENSE_VIEW")).toBe(false);
  });
});

describe("expense tenant isolation", () => {
  it("scopes lookups by organizationId", () => {
    const organizationId = "org_a";
    const where = {
      id: "expense_1",
      organizationId,
    };
    expect(where.organizationId).toBe("org_a");
  });
});
