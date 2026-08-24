"use client";

import { useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
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
import {
  FreelancerBrand,
  FreelancerSidebarNav,
} from "@/components/freelancer/freelancer-sidebar";
import { UserAvatar } from "@/components/shared/user-avatar";

export function FreelancerHeader({
  userName,
  organizationName,
}: {
  userName: string;
  organizationName: string;
}) {
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
            <SheetTitle className="sr-only">Freelancer navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Freelancer portal sections
            </SheetDescription>
            <FreelancerBrand />
            <FreelancerSidebarNav onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-2.5">
                <UserAvatar name={userName} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {userName}
                  </p>
                  <p className="truncate text-caption text-sidebar-muted">
                    {organizationName}
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

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Freelancer workspace</p>
          <p className="truncate text-caption text-muted-foreground">
            {organizationName}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() =>
            setTheme((resolvedTheme ?? theme) === "dark" ? "light" : "dark")
          }
        >
          <Sun className="h-4 w-4 dark:hidden" />
          <Moon className="hidden h-4 w-4 dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label="Account">
              <UserAvatar name={userName} size="sm" />
              <span className="hidden max-w-[8rem] truncate text-sm md:inline">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-caption">{organizationName}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <SignOutMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
