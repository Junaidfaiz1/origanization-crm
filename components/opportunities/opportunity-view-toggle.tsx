"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function OpportunityViewToggle() {
  const params = useSearchParams();
  const view = params.get("view") === "kanban" ? "kanban" : "list";

  function hrefFor(nextView: "list" | "kanban") {
    const next = new URLSearchParams(params.toString());
    if (nextView === "list") {
      next.delete("view");
    } else {
      next.set("view", "kanban");
    }
    next.delete("cursor");
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  }

  return (
    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
      <Link
        href={hrefFor("list")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium",
          view === "list"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-current={view === "list" ? "page" : undefined}
      >
        <List className="h-3.5 w-3.5" />
        List
      </Link>
      <Link
        href={hrefFor("kanban")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium",
          view === "kanban"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-current={view === "kanban" ? "page" : undefined}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Board
      </Link>
    </div>
  );
}
