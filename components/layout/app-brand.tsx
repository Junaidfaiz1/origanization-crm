import { cn } from "@/lib/utils/cn";

export function AppBrand({
  title = "TechNova CRM",
  subtitle = "Agency workspace",
  collapsed = false,
  className,
}: {
  title?: string;
  subtitle?: string;
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4",
        collapsed && "justify-center px-2",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-foreground font-display text-[13px] font-bold text-background">
        TN
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate font-display text-[15px] font-semibold text-sidebar-foreground">
            {title}
          </p>
          <p className="truncate text-caption text-sidebar-muted">{subtitle}</p>
        </div>
      ) : null}
    </div>
  );
}

export function navLinkClass(active: boolean, collapsed = false) {
  return cn(
    "group relative flex min-h-9 items-center gap-2.5 rounded-lg text-sm transition-colors",
    collapsed ? "justify-center px-2 py-2" : "px-2.5 py-1.5",
    active
      ? "bg-sidebar-accent font-semibold text-sidebar-active"
      : "text-sidebar-muted hover:bg-muted hover:text-sidebar-foreground",
  );
}