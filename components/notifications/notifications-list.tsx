"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DateDisplay } from "@/components/shared/date-display";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/modules/notifications/actions";
import type { SerializedNotification } from "@/modules/notifications/service";
import { cn } from "@/lib/utils/cn";

export function NotificationsList({
  notifications,
}: {
  notifications: SerializedNotification[];
}) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {notifications.map((item) => (
        <li
          key={item.id}
          className={cn(
            "flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between",
            item.unread && "bg-muted/30",
          )}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {item.unread ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
              ) : null}
              <p className="font-medium">{item.title}</p>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.type.replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{item.message}</p>
            <p className="text-xs text-muted-foreground">
              <DateDisplay value={item.createdAt} />
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {item.href ? (
              <Button asChild variant="outline" size="sm">
                <Link href={item.href}>Open</Link>
              </Button>
            ) : null}
            {item.unread ? (
              <form action={markNotificationReadAction}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" variant="ghost" size="sm">
                  Mark read
                </Button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MarkAllNotificationsReadButton({ disabled }: { disabled?: boolean }) {
  return (
    <form action={markAllNotificationsReadAction}>
      <Button type="submit" variant="outline" disabled={disabled}>
        Mark all read
      </Button>
    </form>
  );
}
