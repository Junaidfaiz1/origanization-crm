export type ProfitInput = {
  revenue: number;
  resourceCost: number;
  expenses: number;
  paymentFees: number;
};

export type ProfitResult = {
  revenue: number;
  resourceCost: number;
  expenses: number;
  paymentFees: number;
  profit: number;
  profitMargin: number | null;
};

export function calculateProfit(input: ProfitInput): ProfitResult {
  const revenue = input.revenue;
  const resourceCost = input.resourceCost;
  const expenses = input.expenses;
  const paymentFees = input.paymentFees;
  const profit = revenue - resourceCost - expenses - paymentFees;
  const profitMargin = revenue === 0 ? null : (profit / revenue) * 100;

  return {
    revenue,
    resourceCost,
    expenses,
    paymentFees,
    profit,
    profitMargin,
  };
}
