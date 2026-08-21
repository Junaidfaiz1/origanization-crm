import {
  Bell,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  FolderKanban,
  Gavel,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Wallet,
  BarChart3,
  Contact,
  Handshake,
  ListTodo,
  CreditCard,
  Timer,
  ListChecks,
  UsersRound,
  Paperclip,
  History,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import type { PermissionKey } from "@/config/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: PermissionKey;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "CRM",
    items: [
      { href: "/leads", label: "Leads", icon: Contact, permission: "LEAD_VIEW" },
      { href: "/companies", label: "Companies", icon: Building2, permission: "COMPANY_VIEW" },
      { href: "/contacts", label: "Contacts", icon: Users, permission: "COMPANY_VIEW" },
      { href: "/clients", label: "Clients", icon: Handshake, permission: "CLIENT_VIEW" },
      { href: "/opportunities", label: "Opportunities", icon: Briefcase, permission: "OPPORTUNITY_VIEW" },
      { href: "/proposals", label: "Proposals", icon: FileText, permission: "PROPOSAL_VIEW" },
    ],
  },
  {
    title: "Delivery",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban, permission: "PROJECT_VIEW" },
      { href: "/progress", label: "Progress", icon: Gauge, permission: "PROJECT_VIEW" },
      { href: "/requirements", label: "Requirements", icon: ListChecks, permission: "PROJECT_VIEW" },
      { href: "/team", label: "Team", icon: UsersRound, permission: "PROJECT_VIEW" },
      { href: "/files", label: "Files", icon: Paperclip, permission: "PROJECT_VIEW" },
      { href: "/activity", label: "Activity", icon: History, permission: "PROJECT_VIEW" },
      { href: "/bidding", label: "Bidding", icon: Gavel, permission: "BID_REQUEST_VIEW" },
      { href: "/resources", label: "Resources", icon: Users, permission: "RESOURCE_VIEW" },
      { href: "/milestones", label: "Milestones", icon: ClipboardList, permission: "PROJECT_VIEW" },
      { href: "/tasks", label: "Tasks", icon: ListTodo, permission: "TASK_VIEW" },
      { href: "/time-tracking", label: "Time tracking", icon: Timer, permission: "TIME_ENTRY_VIEW" },
      { href: "/contracts", label: "Contracts", icon: FileText, permission: "CONTRACT_VIEW" },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/invoices", label: "Invoices", icon: Receipt, permission: "INVOICE_VIEW" },
      { href: "/payments", label: "Payments", icon: CreditCard, permission: "PAYMENT_VIEW" },
      { href: "/expenses", label: "Expenses", icon: Wallet, permission: "EXPENSE_VIEW" },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, permission: "REPORT_VIEW" },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];
