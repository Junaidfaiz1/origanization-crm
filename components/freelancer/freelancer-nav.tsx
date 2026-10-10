import {
  Briefcase,
  Clock,
  Gavel,
  LayoutDashboard,
  ListTodo,
  UserRound,
  Bell,
  type LucideIcon,
} from "lucide-react";

export type FreelancerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const FREELANCER_NAV: FreelancerNavItem[] = [
  { href: "/freelancer", label: "Overview", icon: LayoutDashboard },
  { href: "/freelancer/requests", label: "Open requests", icon: Briefcase },
  { href: "/freelancer/bids", label: "My bids", icon: Gavel },
  { href: "/freelancer/tasks", label: "Tasks", icon: ListTodo },
  { href: "/freelancer/time", label: "Time", icon: Clock },
  { href: "/freelancer/profile", label: "Profile", icon: UserRound },
  { href: "/freelancer/notifications", label: "Notifications", icon: Bell },
];
