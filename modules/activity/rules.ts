export const PROJECT_ACTIVITY_ENTITY_TYPES = [
  "Project",
  "ProjectRequirement",
  "ProjectMember",
  "Milestone",
  "Task",
  "File",
  "BidRequest",
  "Bid",
  "Contract",
  "Expense",
  "Invoice",
  "Payment",
  "TimeEntry",
] as const;

export type ProjectActivityEntityType =
  (typeof PROJECT_ACTIVITY_ENTITY_TYPES)[number];

export function activityHref(
  entityType: string,
  entityId: string,
): string | null {
  switch (entityType) {
    case "Project":
      return `/projects/${entityId}`;
    case "ProjectRequirement":
      return `/requirements/${entityId}`;
    case "ProjectMember":
      return `/team/${entityId}`;
    case "Milestone":
      return `/milestones/${entityId}`;
    case "Task":
      return `/tasks/${entityId}`;
    case "File":
      return `/files/${entityId}`;
    case "BidRequest":
      return `/bidding/requests/${entityId}`;
    case "Bid":
      return `/bidding/my-bids/${entityId}`;
    case "Contract":
      return `/contracts/${entityId}`;
    case "Expense":
      return `/expenses/${entityId}`;
    case "Invoice":
      return `/invoices/${entityId}`;
    case "Payment":
      return `/payments/${entityId}`;
    case "TimeEntry":
      return `/time-tracking/${entityId}`;
    default:
      return null;
  }
}

export function summarizeActivityChange(
  oldValue: unknown,
  newValue: unknown,
): string | null {
  const next =
    newValue && typeof newValue === "object" && !Array.isArray(newValue)
      ? (newValue as Record<string, unknown>)
      : null;
  const prev =
    oldValue && typeof oldValue === "object" && !Array.isArray(oldValue)
      ? (oldValue as Record<string, unknown>)
      : null;

  if (next?.status != null && prev?.status != null && next.status !== prev.status) {
    return `Status ${String(prev.status)} → ${String(next.status)}`;
  }
  if (next?.status != null && prev?.status == null) {
    return `Status ${String(next.status)}`;
  }
  if (next?.name != null) {
    return String(next.name);
  }
  if (next?.title != null) {
    return String(next.title);
  }
  if (next?.fileName != null) {
    return String(next.fileName);
  }
  if (next?.role != null) {
    return `Role ${String(next.role)}`;
  }
  return null;
}
