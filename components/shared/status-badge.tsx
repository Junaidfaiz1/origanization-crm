import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const TONES: Record<string, string> = {
  NEW: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800",
  CONTACTED: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200",
  QUALIFIED: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-200",
  UNQUALIFIED: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  CONVERTED: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  LOST: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200",
  ACTIVE: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  INACTIVE: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  ON_HOLD: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200",
  DISCOVERY: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200",
  REQUIREMENTS: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200",
  PROPOSAL: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200",
  NEGOTIATION: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
  WON: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  DRAFT: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  SENT: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200",
  SIGNED: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200",
  VIEWED: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200",
  CHANGES_REQUESTED:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200",
  ACCEPTED: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  APPROVED: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  REJECTED: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200",
  EXPIRED: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300",
  PLANNING: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  BIDDING: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200",
  RESOURCE_ASSIGNED:
    "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200",
  IN_PROGRESS: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200",
  IN_REVIEW: "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  CANCELLED: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200",
  CLOSED: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300",
  PENDING: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  BLOCKED: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200",
  OPEN: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  PAUSED: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200",
  AWARDED: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200",
  SUBMITTED: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200",
  SHORTLISTED: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200",
  WITHDRAWN: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300",
  COUNTER_OFFER:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200",
  OFFER: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200",
  TODO: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300",
  DONE: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  LOW: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300",
  MEDIUM: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-200",
  HIGH: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/40 dark:text-orange-200",
  URGENT: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200",
  AVAILABLE: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  BUSY: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200",
  UNAVAILABLE: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300",
  EMPLOYEE: "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200",
  FREELANCER: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-200",
  PARTIALLY_PAID:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200",
  PAID: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  OVERDUE: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200",
  SUCCEEDED:
    "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200",
  REFUNDED: "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300",
  FAILED: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-200",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ").toLowerCase();
  return (
    <Badge className={cn("capitalize", TONES[status])}>{label}</Badge>
  );
}
