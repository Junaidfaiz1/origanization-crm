import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/shared/status-badge";

export function EntityHeader({
  backHref,
  backLabel = "Back",
  title,
  description,
  status,
  meta,
  actions,
  className,
}: {
  backHref?: string;
  backLabel?: string;
  title: string;
  description?: string;
  status?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1">{title}</h1>
            {status ? <StatusBadge status={status} /> : null}
          </div>
          {description ? (
            <p className="max-w-2xl text-body text-muted-foreground">
              {description}
            </p>
          ) : null}
          {meta ? <div className="pt-1 text-caption">{meta}</div> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}

export function EntityTabs({
  items,
  activeHref,
}: {
  items: { href: string; label: string }[];
  activeHref: string;
}) {
  return (
    <nav
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-border px-1 pb-px"
      aria-label="Section"
    >
      {items.map((item) => {
        const active =
          activeHref === item.href ||
          (item.href !== "#" && activeHref.startsWith(item.href));
        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
