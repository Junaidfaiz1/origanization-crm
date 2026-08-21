import { BusinessRuleError } from "@/lib/errors/app-error";
import {
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@/modules/notifications/types";

export function assertNotificationOwned(
  notification: { userId: string } | null,
  userId: string,
): asserts notification is { userId: string } {
  if (!notification || notification.userId !== userId) {
    throw new BusinessRuleError("Notification not found");
  }
}

export function isNotificationType(value: string): value is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export type NotificationAudience = "dashboard" | "client" | "freelancer";

/** Href for a notification entity, scoped to the viewer’s surface. */
export function notificationHref(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
  audience: NotificationAudience = "dashboard",
): string | null {
  if (!entityType || !entityId) {
    return null;
  }

  if (audience === "client") {
    switch (entityType) {
      case "Proposal":
        return `/portal/proposals/${entityId}`;
      case "Invoice":
        return `/portal/invoices/${entityId}`;
      case "Payment":
        return `/portal/payments/${entityId}`;
      case "Project":
        return `/portal/projects/${entityId}`;
      default:
        return null;
    }
  }

  if (audience === "freelancer") {
    switch (entityType) {
      case "Bid":
        return `/freelancer/bids/${entityId}`;
      case "BidRequest":
        return `/freelancer/requests/${entityId}`;
      case "Task":
        return `/freelancer/tasks/${entityId}`;
      default:
        return null;
    }
  }

  switch (entityType) {
    case "Bid":
      return `/bidding/my-bids/${entityId}`;
    case "BidRequest":
      return `/bidding/requests/${entityId}`;
    case "Proposal":
      return `/proposals/${entityId}`;
    case "Task":
      return `/tasks/${entityId}`;
    case "Invoice":
      return `/invoices/${entityId}`;
    case "Payment":
      return `/payments/${entityId}`;
    case "Project":
      return `/projects/${entityId}`;
    default:
      return null;
  }
}
