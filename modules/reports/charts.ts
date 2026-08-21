/** Pure helpers for report chart series (unit-tested). */

export type MonthBucket = {
  key: string;
  label: string;
  amount: number;
};

export type NamedCount = {
  label: string;
  count: number;
};

export type NamedAmount = {
  label: string;
  amount: number;
};

export type NamedValueCount = {
  label: string;
  count: number;
  value: number;
};

export function humanizeKey(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** Build empty month buckets ending at `now` (inclusive), oldest → newest. */
export function buildMonthBuckets(months: number, now = new Date()): MonthBucket[] {
  const count = Math.max(1, Math.min(24, months));
  const buckets: MonthBucket[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
    buckets.push({ key, label, amount: 0 });
  }

  return buckets;
}

export function monthKeyFromDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function bucketAmountsByMonth(
  rows: Array<{ at: Date; amount: number }>,
  months = 6,
  now = new Date(),
): MonthBucket[] {
  const buckets = buildMonthBuckets(months, now);
  const index = new Map(buckets.map((bucket, i) => [bucket.key, i]));

  for (const row of rows) {
    const key = monthKeyFromDate(row.at);
    const i = index.get(key);
    if (i == null) continue;
    buckets[i]!.amount += row.amount;
  }

  return buckets.map((bucket) => ({
    ...bucket,
    amount: Number(bucket.amount.toFixed(2)),
  }));
}

export function buildBidConversionSeries(input: {
  totalRequests: number;
  openRequests: number;
  awardedRequests: number;
}): NamedCount[] {
  return [
    { label: "Requests", count: input.totalRequests },
    { label: "Open", count: input.openRequests },
    { label: "Awarded", count: input.awardedRequests },
  ];
}

export function buildFinanceBreakdownSeries(input: {
  revenue: number;
  resourceCost: number;
  expenses: number;
}): NamedAmount[] {
  return [
    { label: "Revenue", amount: Number(input.revenue.toFixed(2)) },
    { label: "Resource cost", amount: Number(input.resourceCost.toFixed(2)) },
    { label: "Expenses", amount: Number(input.expenses.toFixed(2)) },
  ];
}
