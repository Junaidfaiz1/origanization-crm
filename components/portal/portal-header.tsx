"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { logoutAction } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PortalBrand, PortalSidebarNav } from "@/components/portal/portal-sidebar";

export function PortalHeader({
  userName,
  organizationName,
  companyName,
}: {
  userName: string;
  organizationName: string;
  companyName: string;
}) {
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
            <SheetTitle className="sr-only">Portal navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Client portal sections
            </SheetDescription>
            <PortalBrand />
            <PortalSidebarNav onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-sidebar-border p-4">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {companyName} · {organizationName}
              </p>
              <form action={logoutAction} className="mt-3">
                <Button type="submit" variant="outline" className="w-full min-h-11">
                  Sign out
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{companyName}</p>
          <p className="truncate text-xs text-muted-foreground">
            Client of {organizationName}
          </p>
        </div>

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
