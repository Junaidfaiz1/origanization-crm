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
        "flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-3",
        collapsed && "justify-center px-2",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
        TN
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
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
    "group relative flex min-h-9 items-center gap-2.5 rounded-md text-sm transition-colors",
    collapsed ? "justify-center px-2 py-2" : "px-2.5 py-1.5",
    active
      ? "bg-sidebar-accent text-white"
      : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
  );
}

export function NavActiveIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span
      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-active"
      aria-hidden
    />
  );
}
