import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";

/** @deprecated Prefer MetricCard — kept for existing imports. */
export function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return <MetricCard title={title} value={value} hint={hint} icon={icon} />;
}

export { MetricCard, Card, CardContent, CardHeader, CardTitle };
