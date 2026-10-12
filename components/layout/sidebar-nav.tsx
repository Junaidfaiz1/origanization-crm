"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/components/layout/nav";
import {
  AppBrand,
  navLinkClass,
} from "@/components/layout/app-brand";
import { hasPermission, type PermissionKey } from "@/config/permissions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

type SidebarNavProps = {
  onNavigate?: () => void;
  permissions?: string[];
  collapsed?: boolean;
};

export function SidebarNav({
  onNavigate,
  permissions = [],
  collapsed = false,
}: SidebarNavProps) {
  const currentPath = usePathname();

  const content = (
    <nav
      className={cn(
        "flex-1 overflow-y-auto overscroll-contain py-3",
        collapsed ? "px-1.5" : "px-2.5",
      )}
    >
      {NAV_SECTIONS.map((section) => {
        const items = section.items.filter(
          (item) =>
            !item.permission ||
            hasPermission(permissions, item.permission as PermissionKey),
        );
        if (items.length === 0) {
          return null;
        }
        return (
          <div key={section.title} className="mb-4">
            {!collapsed ? (
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {section.title}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" aria-hidden />
            )}
            <div className="space-y-0.5">
              {items.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? currentPath === "/dashboard"
                    : currentPath === item.href ||
                      currentPath.startsWith(`${item.href}/`);
                const Icon = item.icon;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={navLinkClass(active, collapsed)}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ? (
                      <span className="truncate">{item.label}</span>
                    ) : (
                      <span className="sr-only">{item.label}</span>
                    )}
                  </Link>
                );

                if (!collapsed) {
                  return link;
                }

                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  if (collapsed) {
    return <TooltipProvider delayDuration={200}>{content}</TooltipProvider>;
  }

  return content;
}

export function SidebarBrand({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  return <AppBrand collapsed={collapsed} />;
}
