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
    <div className="inline-flex rounded-lg bg-secondary p-[3px]">
      <Link
        href={hrefFor("list")}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium",
          view === "list"
            ? "bg-card text-foreground shadow-xs"
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
          "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium",
          view === "kanban"
            ? "bg-card text-foreground shadow-xs"
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
