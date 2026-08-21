import { describe, expect, it } from "vitest";
import { calculateProfit } from "@/lib/finance/profit";

describe("calculateProfit", () => {
  it("computes profit and margin", () => {
    const result = calculateProfit({
      revenue: 8000,
      resourceCost: 6500,
      expenses: 200,
      paymentFees: 30,
    });

    expect(result.profit).toBe(1270);
    expect(result.profitMargin).toBeCloseTo(15.875);
  });

  it("returns null margin when revenue is zero", () => {
    const result = calculateProfit({
      revenue: 0,
      resourceCost: 100,
      expenses: 0,
      paymentFees: 0,
    });

    expect(result.profit).toBe(-100);
    expect(result.profitMargin).toBeNull();
  });
});
