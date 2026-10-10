import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full border border-transparent bg-secondary px-2.5 text-xs font-medium text-secondary-foreground",
        className,
      )}
      {...props}
    />
  );
}
