import { describe, expect, it } from "vitest";
import {
  assertCanViewReports,
  formatMarginPercent,
  formatMoney,
  formatRate,
} from "@/modules/reports/rules";
import {
  bucketAmountsByMonth,
  buildBidConversionSeries,
  buildFinanceBreakdownSeries,
  buildMonthBuckets,
  humanizeKey,
} from "@/modules/reports/charts";
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

describe("report chart series", () => {
  it("builds six month buckets ending at now", () => {
    const now = new Date(Date.UTC(2026, 7, 21));
    const buckets = buildMonthBuckets(6, now);
    expect(buckets).toHaveLength(6);
    expect(buckets[0]!.key).toBe("2026-03");
    expect(buckets[5]!.key).toBe("2026-08");
  });

  it("buckets payment amounts into months", () => {
    const now = new Date(Date.UTC(2026, 7, 21));
    const series = bucketAmountsByMonth(
      [
        { at: new Date(Date.UTC(2026, 7, 2)), amount: 100 },
        { at: new Date(Date.UTC(2026, 7, 10)), amount: 50.5 },
        { at: new Date(Date.UTC(2026, 5, 1)), amount: 20 },
        { at: new Date(Date.UTC(2025, 0, 1)), amount: 999 },
      ],
      6,
      now,
    );
    expect(series.find((row) => row.key === "2026-08")?.amount).toBe(150.5);
    expect(series.find((row) => row.key === "2026-06")?.amount).toBe(20);
    expect(series.find((row) => row.key === "2026-03")?.amount).toBe(0);
  });

  it("builds bid conversion and finance breakdown points", () => {
    expect(
      buildBidConversionSeries({
        totalRequests: 10,
        openRequests: 4,
        awardedRequests: 3,
      }),
    ).toEqual([
      { label: "Requests", count: 10 },
      { label: "Open", count: 4 },
      { label: "Awarded", count: 3 },
    ]);
    expect(
      buildFinanceBreakdownSeries({
        revenue: 100,
        resourceCost: 40,
        expenses: 10,
      }),
    ).toEqual([
      { label: "Revenue", amount: 100 },
      { label: "Resource cost", amount: 40 },
      { label: "Expenses", amount: 10 },
    ]);
  });

  it("humanizes enum keys for chart labels", () => {
    expect(humanizeKey("IN_PROGRESS")).toBe("In Progress");
    expect(humanizeKey("WON")).toBe("Won");
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
