"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
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
import { SidebarBrand, SidebarNav } from "@/components/layout/sidebar-nav";

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

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 lg:px-8">
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
            <SidebarNav permissions={permissions} onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-sidebar-border p-4">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {organizationName} · {roleName}
              </p>
              <form action={logoutAction} className="mt-3">
                <Button type="submit" variant="outline" className="w-full min-h-11">
                  Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-medium">{organizationName}</p>
          <p className="truncate text-xs text-muted-foreground">{roleName}</p>
        </div>

        <div className="relative min-w-0 flex-1 lg:mx-6 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="h-11 min-w-0 pl-9 md:h-10"
            aria-label="Search leads, projects, and invoices"
          />
        </div>

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

        <div className="hidden min-w-0 text-right sm:block">
          <p className="max-w-[10rem] truncate text-sm font-medium lg:max-w-none">
            {userName}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
