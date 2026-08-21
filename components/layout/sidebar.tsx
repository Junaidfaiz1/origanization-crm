"use client";

import { SidebarBrand, SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar({ permissions }: { permissions: string[] }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <SidebarBrand />
      <SidebarNav permissions={permissions} />
    </aside>
  );
}
