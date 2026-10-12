import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success/10 text-success dark:bg-success/15",
  warning: "bg-warning/10 text-warning dark:bg-warning/15",
  error: "bg-destructive/10 text-destructive dark:bg-destructive/15",
  info: "bg-info/10 text-info dark:bg-info/15",
  neutral: "bg-secondary text-secondary-foreground",
};

/** Map domain statuses to a small semantic palette for consistency across modules. */
const STATUS_TONES: Record<string, StatusTone> = {
  // Success
  ACTIVE: "success",
  AVAILABLE: "success",
  OPEN: "success",
  PAID: "success",
  COMPLETED: "success",
  ACCEPTED: "success",
  APPROVED: "success",
  WON: "success",
  CONVERTED: "success",
  DONE: "success",
  SUCCEEDED: "success",
  SIGNED: "success",
  AWARDED: "success",
  ON_TRACK: "success",

  // Warning
  PENDING: "warning",
  ON_HOLD: "warning",
  PAUSED: "warning",
  IN_REVIEW: "warning",
  CHANGES_REQUESTED: "warning",
  PARTIALLY_PAID: "warning",
  COUNTER_OFFER: "warning",
  AT_RISK: "warning",
  BUSY: "warning",
  HIGH: "warning",
  SHORTLISTED: "warning",

  // Error
  FAILED: "error",
  REJECTED: "error",
  OVERDUE: "error",
  CANCELLED: "error",
  LOST: "error",
  BLOCKED: "error",
  DELAYED: "error",
  URGENT: "error",
  UNAVAILABLE: "error",
  UNQUALIFIED: "error",

  // Info
  SENT: "info",
  IN_PROGRESS: "info",
  NEW: "info",
  CONTACTED: "info",
  QUALIFIED: "info",
  SUBMITTED: "info",
  VIEWED: "info",
  OFFER: "info",
  RESOURCE_ASSIGNED: "info",
  BIDDING: "info",
  DISCOVERY: "info",
  REQUIREMENTS: "info",
  PROPOSAL: "info",
  NEGOTIATION: "info",
  MEDIUM: "info",
  EMPLOYEE: "info",
  FREELANCER: "info",

  // Neutral
  DRAFT: "neutral",
  INACTIVE: "neutral",
  CLOSED: "neutral",
  EXPIRED: "neutral",
  WITHDRAWN: "neutral",
  REFUNDED: "neutral",
  TODO: "neutral",
  PLANNING: "neutral",
  LOW: "neutral",
  NOT_STARTED: "neutral",
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONES[status] ?? "neutral";
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const label = status.replaceAll("_", " ").toLowerCase();
  const tone = statusTone(status);
  return (
    <Badge className={cn("capitalize", TONE_CLASSES[tone], className)}>
      <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
      {label}
    </Badge>
  );
}
