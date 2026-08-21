import Link from "next/link";
import { requireFreelancerUser } from "@/lib/auth/page";
import { notificationListFilterSchema } from "@/modules/notifications/validation";
import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/modules/notifications/service";
import {
  MarkAllNotificationsReadButton,
  NotificationsList,
} from "@/components/notifications/notifications-list";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { Pagination } from "@/components/shared/pagination";

export const metadata = { title: "Notifications" };

export default async function FreelancerNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ unread?: string; cursor?: string }>;
}) {
  const ctx = await requireFreelancerUser();
  const params = await searchParams;
  const filter = notificationListFilterSchema.parse({
    unreadOnly: params.unread,
    cursor: params.cursor,
    first: 20,
  });

  let result;
  let unreadCount = 0;
  try {
    [result, unreadCount] = await Promise.all([
      listNotifications(ctx, filter),
      getUnreadNotificationCount(ctx),
    ]);
  } catch {
    return (
      <ErrorState
        title="Could not load notifications"
        description="Check the database connection and try again."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates on your bids and assigned tasks.
            {unreadCount > 0 ? ` ${unreadCount} unread.` : ""}
          </p>
        </div>
        <MarkAllNotificationsReadButton disabled={unreadCount === 0} />
      </div>

      <FilterBar>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/freelancer/notifications"
            className={
              !params.unread
                ? "rounded-md bg-muted px-3 py-1.5 text-sm font-medium"
                : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            All
          </Link>
          <Link
            href="/freelancer/notifications?unread=true"
            className={
              params.unread === "true"
                ? "rounded-md bg-muted px-3 py-1.5 text-sm font-medium"
                : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            Unread
          </Link>
        </div>
      </FilterBar>

      {result.nodes.length === 0 ? (
        <EmptyState
          title={params.unread === "true" ? "No unread notifications" : "No notifications yet"}
          description="You’ll be notified when bids are accepted or tasks are assigned."
        />
      ) : (
        <>
          <NotificationsList notifications={result.nodes} />
          <Pagination
            hasNextPage={result.pageInfo.hasNextPage}
            endCursor={result.pageInfo.endCursor}
            currentQuery={{ unread: params.unread }}
          />
        </>
      )}
    </div>
  );
}
