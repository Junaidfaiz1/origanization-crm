import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({
  showFilters = true,
  rows = 4,
}: {
  showFilters?: boolean;
  rows?: number;
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      {showFilters ? <Skeleton className="h-9 w-full max-w-md" /> : null}
      <div className="hidden space-y-0 overflow-hidden rounded-lg border border-border md:block">
        <Skeleton className="h-10 w-full rounded-none" />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-none border-t border-border" />
        ))}
      </div>
      <div className="space-y-2.5 md:hidden">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
