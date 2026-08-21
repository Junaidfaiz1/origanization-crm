import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import type { SerializedActivity } from "@/modules/activity/service";

export function ActivityFeed({ items }: { items: SerializedActivity[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {items.map((item) => {
        const body = (
          <div className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium">{item.action}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.entityType}
                {item.summary ? ` · ${item.summary}` : null}
                {item.user ? ` · ${item.user.name}` : null}
              </p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">
              <DateDisplay value={item.createdAt} />
            </p>
          </div>
        );

        if (item.href) {
          return (
            <li key={item.id}>
              <Link href={item.href} className="block hover:bg-muted/40">
                {body}
              </Link>
            </li>
          );
        }

        return <li key={item.id}>{body}</li>;
      })}
    </ul>
  );
}
