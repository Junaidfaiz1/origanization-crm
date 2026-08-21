"use client";

import Link from "next/link";
import { ChevronsLeft, ChevronsRight, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/modules/auth/actions";
import { SidebarBrand, SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSidebarStore } from "@/lib/ui/sidebar-store";
import { cn } from "@/lib/utils/cn";

type SidebarProps = {
  permissions: string[];
  userName: string;
  organizationName: string;
  roleName: string;
};

export function Sidebar({
  permissions,
  userName,
  organizationName,
  roleName,
}: SidebarProps) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.25rem]" : "w-60",
      )}
    >
      <SidebarBrand collapsed={collapsed} />
      <SidebarNav permissions={permissions} collapsed={collapsed} />

      <div
        className={cn(
          "mt-auto border-t border-sidebar-border p-2",
          collapsed && "flex flex-col items-center gap-1",
        )}
      >
        <TooltipProvider delayDuration={200}>
          {!collapsed ? (
            <div className="mb-2 flex items-center gap-2.5 rounded-md px-2 py-2">
              <UserAvatar name={userName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {userName}
                </p>
                <p className="truncate text-caption text-sidebar-muted">
                  {organizationName} · {roleName}
                </p>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mb-1">
                  <UserAvatar name={userName} size="sm" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {userName} · {roleName}
              </TooltipContent>
            </Tooltip>
          )}

          <div
            className={cn(
              "flex gap-1",
              collapsed ? "flex-col items-center" : "items-center",
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
                  asChild
                >
                  <Link href="/settings" aria-label="Settings">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? "right" : "top"}>
                Settings
              </TooltipContent>
            </Tooltip>

            <form action={logoutAction}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "top"}>
                  Sign out
                </TooltipContent>
              </Tooltip>
            </form>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
                  onClick={toggle}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <ChevronsRight className="h-4 w-4" />
                  ) : (
                    <ChevronsLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? "right" : "top"}>
                {collapsed ? "Expand" : "Collapse"}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </aside>
  );
}
