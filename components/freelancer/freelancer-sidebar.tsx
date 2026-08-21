"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FREELANCER_NAV } from "@/components/freelancer/freelancer-nav";
import { AppBrand, NavActiveIndicator, navLinkClass } from "@/components/layout/app-brand";

export function FreelancerSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const currentPath = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-3">
      <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
        Work portal
      </p>
      <div className="space-y-0.5">
        {FREELANCER_NAV.map((item) => {
          const active =
            item.href === "/freelancer"
              ? currentPath === "/freelancer"
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
              <NavActiveIndicator active={active} />
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
  return <AppBrand title="TechNova" subtitle="Freelancer portal" />;
}
