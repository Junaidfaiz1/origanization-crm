import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type StatusTone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    "border-success/25 bg-success/10 text-success dark:border-success/30 dark:bg-success/15 dark:text-success",
  warning:
    "border-warning/25 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/15 dark:text-warning",
  error:
    "border-destructive/25 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/15",
  info: "border-info/25 bg-info/10 text-info dark:border-info/30 dark:bg-info/15 dark:text-info",
  neutral:
    "border-border bg-muted text-muted-foreground dark:border-border-strong",
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
      {label}
    </Badge>
  );
}
