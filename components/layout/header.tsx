"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { logoutAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarBrand, SidebarNav } from "@/components/layout/sidebar-nav";
import { UserAvatar } from "@/components/shared/user-avatar";

type HeaderProps = {
  userName: string;
  organizationName: string;
  roleName: string;
  permissions: string[];
  unreadNotificationCount?: number;
};

export function Header({
  userName,
  organizationName,
  roleName,
  permissions,
  unreadNotificationCount = 0,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Primary workspace sections
            </SheetDescription>
            <SidebarBrand />
            <SidebarNav
              permissions={permissions}
              onNavigate={() => setMenuOpen(false)}
            />
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={userName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {userName}
                  </p>
                  <p className="truncate text-caption text-sidebar-muted">
                    {organizationName} · {roleName}
                  </p>
                </div>
              </div>
              <form action={logoutAction} className="mt-3">
                <Button type="submit" variant="outline" className="w-full">
                  Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-medium">{organizationName}</p>
          <p className="truncate text-caption text-muted-foreground">{roleName}</p>
        </div>

        <div className="relative min-w-0 flex-1 lg:mx-4 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search workspace…"
            className="h-9 min-w-0 pl-9"
            aria-label="Search leads, projects, and invoices"
            disabled
            title="Global search coming soon"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label="Toggle theme"
          onClick={() =>
            setTheme(
              (resolvedTheme ?? theme) === "dark" ? "light" : "dark",
            )
          }
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>

        <Button variant="ghost" size="icon" className="relative shrink-0" asChild>
          <Link
            href="/notifications"
            aria-label={
              unreadNotificationCount > 0
                ? `Notifications, ${unreadNotificationCount} unread`
                : "Notifications"
            }
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            ) : null}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 gap-2 px-1.5 sm:px-2"
              aria-label="Account menu"
            >
              <UserAvatar name={userName} size="sm" />
              <span className="hidden max-w-[8rem] truncate text-sm font-medium md:inline">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="truncate text-sm font-medium text-foreground">
                {userName}
              </p>
              <p className="truncate text-caption">{organizationName}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction} className="w-full">
                <button type="submit" className="w-full text-left">
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
