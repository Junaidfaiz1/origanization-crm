"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FREELANCER_NAV } from "@/components/freelancer/freelancer-nav";
import { cn } from "@/lib/utils/cn";

export function FreelancerSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const currentPath = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
      <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
        Freelancer portal
      </p>
      <div className="space-y-1">
        {FREELANCER_NAV.map((item) => {
          const active =
            item.href === "/freelancer"
              ? currentPath === "/freelancer"
              : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function FreelancerBrand() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        TN
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">TechNova</p>
        <p className="truncate text-xs text-sidebar-muted">Freelancer portal</p>
      </div>
    </div>
  );
}
