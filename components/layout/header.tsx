"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { logoutAction } from "@/modules/auth/actions";
import { SignOutMenuItem } from "@/components/auth/sign-out-menu-item";
import { Button } from "@/components/ui/button";
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
import { HeaderSearch } from "@/components/layout/header-search";
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
    <header className="z-20 shrink-0 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
      <div className="flex h-16 items-center gap-2 px-3 sm:px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)_minmax(0,1fr)] lg:gap-4 lg:px-6">
        {/* Left — menu (mobile) + org context */}
        <div className="flex min-w-0 items-center gap-2 lg:justify-self-start">
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
        </div>

        {/* Center — search (flex-1 on mobile; truly centered on lg) */}
        <div className="relative min-w-0 flex-1 lg:mx-auto lg:w-full lg:max-w-xs lg:flex-none lg:justify-self-center">
          <HeaderSearch />
        </div>

        {/* Right — theme, notifications, account */}
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5 lg:justify-self-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme((resolvedTheme ?? theme) === "dark" ? "light" : "dark")
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
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-card">
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
              <SignOutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
