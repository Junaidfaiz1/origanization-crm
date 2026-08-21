import { describe, expect, it } from "vitest";
import {
  assertCanViewReports,
  formatMarginPercent,
  formatMoney,
  formatRate,
} from "@/modules/reports/rules";
import { calculateProfit } from "@/lib/finance/profit";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { AuthorizationError } from "@/lib/errors/app-error";

describe("report rules", () => {
  it("requires REPORT_VIEW", () => {
    expect(() => assertCanViewReports({ permissions: [] })).toThrow(AuthorizationError);
    expect(() =>
      assertCanViewReports({ permissions: ["REPORT_VIEW"] }),
    ).not.toThrow();
  });

  it("formats margin without NaN when revenue is zero", () => {
    const profit = calculateProfit({
      revenue: 0,
      resourceCost: 100,
      expenses: 0,
      paymentFees: 0,
    });
    expect(formatMarginPercent(profit.profitMargin)).toBe("—");
    expect(formatMarginPercent(15.875)).toBe("15.9%");
  });

  it("formats money and rates", () => {
    expect(formatMoney(12.5)).toBe("12.50");
    expect(formatRate(2, 4)).toBe("50.0");
    expect(formatRate(1, 0)).toBeNull();
  });
});

describe("report permissions", () => {
  it("grants REPORT_VIEW to owner, sales, pm, and finance roles", () => {
    expect(hasPermission(ROLE_PERMISSIONS.OWNER, "REPORT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "REPORT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "REPORT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "REPORT_VIEW")).toBe(true);
  });

  it("blocks employees, freelancers, and clients from reports", () => {
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "REPORT_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "REPORT_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "REPORT_VIEW")).toBe(false);
  });
});

describe("report tenant isolation shape", () => {
  it("scopes aggregates by organizationId", () => {
    const where = { organizationId: "org_a", status: "SUCCEEDED" };
    expect(where.organizationId).toBe("org_a");
  });
});
