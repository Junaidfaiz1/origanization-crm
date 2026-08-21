import { FolderOpen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = FolderOpen,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center sm:px-6 sm:py-14",
        className,
      )}
    >
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted"
        aria-hidden
      >
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className="text-h4">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
