import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  CreditCard,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const PORTAL_NAV: PortalNavItem[] = [
  { href: "/portal", label: "Overview", icon: LayoutDashboard },
  { href: "/portal/proposals", label: "Proposals", icon: FileText },
  { href: "/portal/projects", label: "Projects", icon: FolderKanban },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/payments", label: "Payments", icon: CreditCard },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
];
