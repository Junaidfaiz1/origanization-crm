import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  trend?: string;
  className?: string;
};

export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  href,
  trend,
  className,
}: MetricCardProps) {
  const body = (
    <Card className={cn("min-w-0 transition-colors", href && "hover:border-border-strong", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-label text-muted-foreground">{title}</CardTitle>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
      </CardHeader>
      <CardContent>
        <div className="truncate text-h2 tracking-tight">{value}</div>
        {trend ? (
          <p className="mt-1 text-caption text-muted-foreground">{trend}</p>
        ) : null}
        {hint ? (
          <p className="mt-1 text-caption text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
        {body}
      </Link>
    );
  }

  return body;
}
