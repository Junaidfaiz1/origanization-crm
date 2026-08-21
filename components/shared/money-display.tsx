import { cn } from "@/lib/utils/cn";

type MoneyDisplayProps = {
  amount: number | string | null | undefined;
  currency?: string;
  className?: string;
};

export function MoneyDisplay({
  amount,
  currency = "USD",
  className,
}: MoneyDisplayProps) {
  const value = typeof amount === "string" ? Number(amount) : (amount ?? 0);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number.isFinite(value) ? value : 0);

  return <span className={cn("tabular-nums", className)}>{formatted}</span>;
}
