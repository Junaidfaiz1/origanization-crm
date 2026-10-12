"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PORTAL_NAV } from "@/components/portal/portal-nav";
import { navLinkClass } from "@/components/layout/app-brand";

/** Vertical portal nav — used inside the mobile sheet; desktop uses PortalTopNav. */
export function PortalSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const currentPath = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3">
      <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Your workspace
      </p>
      <div className="space-y-0.5">
        {PORTAL_NAV.map((item) => {
          const active =
            item.href === "/portal"
              ? currentPath === "/portal"
              : currentPath === item.href ||
                currentPath.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
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
