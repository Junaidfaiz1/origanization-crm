"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils/cn";

export type PortalTopNavLink = { href: string; label: string };

type PortalTopNavProps = {
  /** "Client portal" / "Freelancer portal" — shown under the org name. */
  portalLabel: string;
  organizationName: string;
  /** Secondary line in the account menu (client company, or org name). */
  accountSubtitle: string;
  userName: string;
  homeHref: string;
  notificationsHref: string;
  links: PortalTopNavLink[];
  /** Vertical nav rendered inside the mobile sheet. */
  renderMobileNav: (onNavigate: () => void) => React.ReactNode;
};

function isActive(pathname: string, href: string, homeHref: string) {
  if (href === homeHref) return pathname === homeHref;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase() || "TN"
  );
}

export function PortalTopNav({
  portalLabel,
  organizationName,
  accountSubtitle,
  userName,
  homeHref,
  notificationsHref,
  links,
  renderMobileNav,
}: PortalTopNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 w-full max-w-[1264px] items-center gap-3 px-3 sm:px-4 lg:gap-5 lg:px-8">
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
            <SheetTitle className="sr-only">{portalLabel} navigation</SheetTitle>
            <SheetDescription className="sr-only">{portalLabel} sections</SheetDescription>
            <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-foreground font-display text-[12px] font-bold text-background">
                {initials(organizationName)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-semibold">{organizationName}</p>
                <p className="truncate text-caption text-primary">{portalLabel}</p>
              </div>
            </div>
            {renderMobileNav(() => setMenuOpen(false))}
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={userName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-caption text-muted-foreground">{accountSubtitle}</p>
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

        <Link href={homeHref} className="flex min-w-0 items-center gap-3">
          <span className="hidden h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-foreground font-display text-[13px] font-bold text-background sm:flex">
            {initials(organizationName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold">{organizationName}</span>
            <span className="block truncate text-xs font-medium text-primary">{portalLabel}</span>
          </span>
        </Link>

        <nav aria-label={portalLabel} className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = isActive(pathname, link.href, homeHref);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-[38px] items-center whitespace-nowrap rounded-[9px] px-3.5 text-sm transition-colors",
                  active
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme((resolvedTheme ?? theme) === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link
              href={notificationsHref}
              aria-label="Notifications"
              aria-current={pathname.startsWith(notificationsHref) ? "page" : undefined}
            >
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-1.5" aria-label="Account menu">
                <UserAvatar name={userName} size="md" />
                <span className="hidden max-w-[9rem] text-left md:block">
                  <span className="block truncate text-sm font-medium">{userName}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {accountSubtitle}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                <p className="truncate text-caption">{accountSubtitle}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <SignOutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
