import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this data. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-border bg-card px-4 py-10 text-center sm:px-6 sm:py-14",
        className,
      )}
    >
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        aria-hidden
      >
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="text-h4">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button className="mt-5" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
